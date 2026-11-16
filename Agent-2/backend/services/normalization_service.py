"""Master Normalization Pipeline Service for Agent 2.

Coordinates data ingestion, field normalization, deduplication, conflict resolution,
cross-metric validation, provenance tracking, and persistence into unified
startup evaluation datasets for Agent 3 (Scoring Engine).
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from backend.models.input_schemas import (
    Agent1Payload,
    Agent6Payload,
    ExternalResearchPayload,
    NormalizationRequest,
)
from backend.models.output_schemas import (
    BusinessInformation,
    FinancialInformation,
    FounderMember,
    MarketInformation,
    ProjectInformation,
    StartupProfile,
    TeamInformation,
    TechnicalInformation,
    TractionInformation,
    UnifiedStartupEvaluationDataset,
)
from backend.normalization.conflict_resolver import (
    CandidateValue,
    resolve_metric_conflict,
    resolve_tech_claim_conflict,
)
from backend.normalization.data_validator import (
    audit_missing_fields,
    validate_financial_metrics,
    validate_market_sizing,
)
from backend.normalization.duplicate_detector import (
    deduplicate_competitors,
    deduplicate_founders,
    deduplicate_string_list,
)
from backend.normalization.field_normalizer import (
    normalize_currency_and_amount,
    normalize_industry,
    normalize_percentage,
    normalize_runway_months,
    normalize_stage,
    normalize_tech_stack,
)
from backend.normalization.provenance_tracker import ProvenanceTracker
from backend.services.agent6_fetcher import agent6_fetcher
from backend.services.llm_harmonizer import LLMHarmonizer
from backend.services.storage_service import storage_service
from backend.services.supabase_client import supabase_client

logger = logging.getLogger("agent2.pipeline")


class NormalizationService:
    def __init__(self):
        self.llm_harmonizer = LLMHarmonizer()

    async def normalize(self, request: NormalizationRequest) -> UnifiedStartupEvaluationDataset:
        """Execute full end-to-end normalization pipeline."""
        analysis_id = request.analysis_id
        norm_id = f"norm_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        tracker = ProvenanceTracker()
        conflicts = []

        # ----------------------------------------------------------------------
        # 1. Ingest & Auto-Fetch Upstream Inputs from Supabase / Siblings
        # ----------------------------------------------------------------------
        a1 = request.agent1_data
        a6 = request.agent6_data
        ext = request.external_research_data

        # Check existing normalized profile in Supabase to enable incremental updates
        existing_norm = None
        if supabase_client.is_configured() and not analysis_id.startswith("test_"):
            try:
                existing_norm = await supabase_client.get_normalized_profile(analysis_id)
                if existing_norm and existing_norm.get("id"):
                    norm_id = existing_norm["id"]
            except Exception as e:
                logger.debug(f"Could not check existing normalized profile: {e}")

        # Fetch from Supabase tables (agent1_evaluations, agent6_evaluations, research_evaluations)
        if not a1 or not a6 or not ext:
            a1_db, a6_db, ext_db = await supabase_client.fetch_upstream_evaluations(analysis_id)
            if not a1 and a1_db:
                try:
                    a1 = Agent1Payload(**a1_db)
                    logger.info(f"Successfully ingested Agent 1 data from Supabase for analysis {analysis_id}.")
                except Exception as e:
                    logger.debug(f"Could not parse fetched Agent 1 data: {e}")

            if not a6 and a6_db:
                try:
                    a6 = Agent6Payload(**a6_db)
                    logger.info(f"Successfully ingested Agent 6 data from Supabase for analysis {analysis_id}.")
                except Exception as e:
                    logger.debug(f"Could not parse fetched Agent 6 data: {e}")

            if not ext and ext_db:
                try:
                    ext = ExternalResearchPayload(**ext_db)
                    logger.info(f"Successfully ingested External Research data from Supabase for analysis {analysis_id}.")
                except Exception as e:
                    logger.debug(f"Could not parse fetched External Research data: {e}")

        # Local fallback for Agent 6 if still missing
        if not a6:
            a6_raw = await agent6_fetcher.fetch_latest()
            if a6_raw:
                try:
                    a6 = Agent6Payload(**a6_raw)
                    logger.info("Successfully ingested Agent 6 data via local fetcher fallback.")
                except Exception as e:
                    logger.debug(f"Could not parse local Agent 6 data: {e}")

        # ----------------------------------------------------------------------
        # 2. Canonical Startup Identity & Harmonization
        # ----------------------------------------------------------------------
        raw_name = (
            request.startup_name
            or (a1.startup_name if a1 else None)
            or (a6.repository.name if a6 and a6.repository else None)
            or "Evaluated Startup"
        )
        canonical_name = raw_name.strip()

        deck_desc = a1.description if a1 else None
        repo_problem = a6.raw_analysis.problem_solved if a6 and a6.raw_analysis else None
        repo_solution = a6.raw_analysis.business_use_case if a6 and a6.raw_analysis else None
        raw_ind = (a1.industry if a1 else None) or "Technology"

        # Semantic Harmonization
        if request.enable_llm_disambiguation:
            harmonized = await self.llm_harmonizer.harmonize_company_profile(
                name=canonical_name,
                deck_description=deck_desc,
                repo_problem=repo_problem,
                repo_solution=repo_solution,
                industry_raw=raw_ind,
            )
        else:
            desc_parts = [p for p in [deck_desc, repo_problem, repo_solution] if p]
            harmonized = {
                "canonical_description": " | ".join(desc_parts) if desc_parts else f"{canonical_name} technology platform.",
                "primary_industry": raw_ind or "B2B Software",
                "business_model": "B2B SaaS / Enterprise Subscription",
                "confidence": 0.85,
            }

        primary_industry = normalize_industry(harmonized.get("primary_industry") or raw_ind)
        description = harmonized.get("canonical_description") or f"{canonical_name} solution platform."
        stage = normalize_stage("Seed")  # default baseline if unspecified

        github_url = (a6.github_url if a6 else None) or (request.metadata.get("github_url") if hasattr(request, "metadata") else None)
        
        startup_profile = StartupProfile(
            canonical_name=canonical_name,
            tagline=deck_desc[:120] if deck_desc else None,
            description=description,
            primary_industry=primary_industry,
            sub_sectors=[primary_industry],
            stage=stage,
            website=None,
            github_url=github_url,
        )
        tracker.record_provenance(
            field_path="startup_profile.canonical_name",
            source_agent="synthesized",
            evidence_snippet=canonical_name,
            confidence_score=0.95,
        )

        # ----------------------------------------------------------------------
        # 3. Business Information & Deduplication
        # ----------------------------------------------------------------------
        business_model = harmonized.get("business_model") or (a1.business_model if a1 else "B2B SaaS")
        
        # Merge competitors from Agent 1 and External Research
        comp_sources = []
        if a1 and a1.competitors:
            comp_sources.append((a1.competitors, "agent1"))
        if ext and ext.competitor_research and ext.competitor_research.competitors:
            ext_comp_names = [c.get("name", "") for c in ext.competitor_research.competitors if isinstance(c, dict)]
            comp_sources.append((ext_comp_names, "external_research"))

        unique_competitors, comp_dups = deduplicate_competitors(comp_sources)

        # Merge risks
        raw_risks = (a1.risks if a1 else []) + (ext.market_research.market_headwinds if ext and ext.market_research else [])
        unique_risks, risk_dups = deduplicate_string_list(raw_risks, field_name="business.risk_factors", source_agent="agent1")

        business_info = BusinessInformation(
            business_model=business_model,
            monetization_structure=[business_model],
            competitors=unique_competitors,
            key_differentiators=[],
            risk_factors=unique_risks,
        )
        tracker.record_provenance(
            field_path="business_information.business_model",
            source_agent="synthesized",
            evidence_snippet=business_model,
            confidence_score=0.88,
        )

        # ----------------------------------------------------------------------
        # 4. Financial Information & Conflict Resolution
        # ----------------------------------------------------------------------
        # Extract Agent 1 financials
        a1_arr_val, _, a1_arr_usd = normalize_currency_and_amount(a1.financials.arr if a1 and a1.financials else None)
        a1_mrr_val, _, a1_mrr_usd = normalize_currency_and_amount(a1.financials.mrr if a1 and a1.financials else None)
        a1_burn_val, _, a1_burn_usd = normalize_currency_and_amount(a1.financials.burn_rate if a1 and a1.financials else None)
        a1_runway_val = normalize_runway_months(a1.financials.runway if a1 and a1.financials else None)
        a1_margin_val = normalize_percentage(a1.financials.gross_margin if a1 and a1.financials else None)
        a1_churn_val = normalize_percentage(a1.financials.churn if a1 and a1.financials else None)
        a1_growth_val = normalize_percentage(a1.financials.growth_rate if a1 and a1.financials else None)
        a1_funding_val, _, a1_funding_usd = normalize_currency_and_amount(a1.funding_raised if a1 else None)

        # Extract External Research financials
        ext_burn_val, _, ext_burn_usd = normalize_currency_and_amount(
            ext.financial_research.estimated_burn_rate if ext and ext.financial_research else None
        )
        ext_runway_val = float(ext.financial_research.runway_months) if ext and ext.financial_research and ext.financial_research.runway_months else None

        # Resolve Burn Rate Conflict if present
        burn_candidates = []
        if a1_burn_usd is not None:
            burn_candidates.append(CandidateValue("agent1", a1_burn_usd, confidence=0.85))
        if ext_burn_usd is not None:
            burn_candidates.append(CandidateValue("external_research", ext_burn_usd, confidence=0.80))
        resolved_burn, burn_conflict = resolve_metric_conflict("monthly_burn_rate", "financials", burn_candidates)
        if burn_conflict:
            conflicts.append(burn_conflict)

        # Resolve Runway Conflict if present
        runway_candidates = []
        if a1_runway_val is not None:
            runway_candidates.append(CandidateValue("agent1", a1_runway_val, confidence=0.85))
        if ext_runway_val is not None:
            runway_candidates.append(CandidateValue("external_research", ext_runway_val, confidence=0.80))
        resolved_runway, runway_conflict = resolve_metric_conflict("runway_months", "financials", runway_candidates)
        if runway_conflict:
            conflicts.append(runway_conflict)

        # Derived Financial Health & Unit Economics
        ltv_cac_ratio = None
        cac_val, _, _ = normalize_currency_and_amount(a1.financials.cac if a1 and a1.financials else None)
        ltv_val, _, _ = normalize_currency_and_amount(a1.financials.ltv if a1 and a1.financials else None)
        if ltv_val and cac_val and cac_val > 0:
            ltv_cac_ratio = round(ltv_val / cac_val, 2)

        capital_eff = "unverified"
        if resolved_runway is not None:
            if resolved_runway < 4.0:
                capital_eff = "critical"
            elif resolved_runway >= 12.0:
                capital_eff = "healthy"
            else:
                capital_eff = "moderate"

        financial_info = FinancialInformation(
            currency="USD",
            annual_recurring_revenue=a1_arr_usd,
            monthly_recurring_revenue=a1_mrr_usd,
            total_capital_raised=a1_funding_usd,
            monthly_burn_rate=resolved_burn,
            runway_months=resolved_runway,
            gross_margin_percentage=a1_margin_val,
            annual_growth_rate_percentage=a1_growth_val,
            churn_rate_percentage=a1_churn_val,
            cac=cac_val,
            ltv=ltv_val,
            ltv_cac_ratio=ltv_cac_ratio,
            capital_efficiency_status=capital_eff,
            investor_syndicate=a1.investors if a1 else [],
        )

        if a1_arr_usd is not None:
            tracker.record_metric(
                metric_name="annual_recurring_revenue",
                original_value=a1.financials.arr if a1 and a1.financials else None,
                normalized_value=a1_arr_usd,
                unit="USD",
                currency="USD",
                source_agent="agent1",
            )
            tracker.record_provenance(
                field_path="financial_information.annual_recurring_revenue",
                source_agent="agent1",
                evidence_snippet=str(a1.financials.arr if a1 and a1.financials else ""),
            )

        # ----------------------------------------------------------------------
        # 5. Team Information & Founders Deduplication
        # ----------------------------------------------------------------------
        raw_founders_dicts = [f.model_dump() for f in a1.founders] if a1 and a1.founders else []
        unique_f_dicts, founder_dups = deduplicate_founders(raw_founders_dicts)

        founders_list: List[FounderMember] = []
        has_tech_founder = False
        for f in unique_f_dicts:
            role = f.get("role", "")
            bg = f.get("background", "")
            is_tech = any(k in f"{role} {bg}".lower() for k in ["cto", "tech", "engineer", "architect", "developer"])
            if is_tech:
                has_tech_founder = True
            founders_list.append(
                FounderMember(
                    name=f.get("name", "Unknown"),
                    role=role,
                    domain_background=bg,
                    is_technical=is_tech,
                )
            )

        team_info = TeamInformation(
            founders=founders_list,
            team_size_estimate=len(founders_list) or 2,
            technical_founder_present=has_tech_founder,
            team_strengths=["Technical Leadership"] if has_tech_founder else [],
        )

        # ----------------------------------------------------------------------
        # 6. Traction Information
        # ----------------------------------------------------------------------
        traction_info = TractionInformation(
            qualitative_traction=[a1.traction] if a1 and a1.traction else [],
        )

        # ----------------------------------------------------------------------
        # 7. Market Information & Authority Conflict Arbitration
        # ----------------------------------------------------------------------
        # Deck estimates
        a1_tam_val, _, a1_tam_usd = normalize_currency_and_amount(a1.market_size.tam if a1 and a1.market_size else None)
        a1_sam_val, _, a1_sam_usd = normalize_currency_and_amount(a1.market_size.sam if a1 and a1.market_size else None)
        a1_som_val, _, a1_som_usd = normalize_currency_and_amount(a1.market_size.som if a1 and a1.market_size else None)

        # External research estimates
        ext_tam_val, _, ext_tam_usd = normalize_currency_and_amount(
            ext.market_research.tam if ext and ext.market_research else None
        )
        ext_sam_val, _, ext_sam_usd = normalize_currency_and_amount(
            ext.market_research.sam if ext and ext.market_research else None
        )
        ext_som_val, _, ext_som_usd = normalize_currency_and_amount(
            ext.market_research.som if ext and ext.market_research else None
        )
        cagr_val = normalize_percentage(ext.market_research.cagr if ext and ext.market_research else None)

        # Resolve Market Sizing Conflict: External Research holds authority
        tam_candidates = []
        if ext_tam_usd is not None:
            tam_candidates.append(CandidateValue("external_research", ext_tam_usd, confidence=0.88))
        if a1_tam_usd is not None:
            tam_candidates.append(CandidateValue("agent1", a1_tam_usd, confidence=0.75))
        resolved_tam, tam_conflict = resolve_metric_conflict("tam_usd", "market_size", tam_candidates)
        if tam_conflict:
            conflicts.append(tam_conflict)

        sam_candidates = []
        if ext_sam_usd is not None:
            sam_candidates.append(CandidateValue("external_research", ext_sam_usd, confidence=0.88))
        if a1_sam_usd is not None:
            sam_candidates.append(CandidateValue("agent1", a1_sam_usd, confidence=0.75))
        resolved_sam, sam_conflict = resolve_metric_conflict("sam_usd", "market_size", sam_candidates)
        if sam_conflict:
            conflicts.append(sam_conflict)

        som_candidates = []
        if ext_som_usd is not None:
            som_candidates.append(CandidateValue("external_research", ext_som_usd, confidence=0.88))
        if a1_som_usd is not None:
            som_candidates.append(CandidateValue("agent1", a1_som_usd, confidence=0.75))
        resolved_som, som_conflict = resolve_metric_conflict("som_usd", "market_size", som_candidates)
        if som_conflict:
            conflicts.append(som_conflict)

        market_info = MarketInformation(
            tam_usd=resolved_tam,
            sam_usd=resolved_sam,
            som_usd=resolved_som,
            cagr_percentage=cagr_val,
            market_drivers=ext.market_research.market_drivers if ext and ext.market_research else [],
            market_headwinds=ext.market_research.market_headwinds if ext and ext.market_research else [],
            sizing_confidence=0.85,
        )

        # ----------------------------------------------------------------------
        # 8. Technical Information (Agent 6 Ground-Truth Integration)
        # ----------------------------------------------------------------------
        raw_tech = (a6.raw_analysis.technology_stack if a6 and a6.raw_analysis else []) or []
        standardized_tech = normalize_tech_stack(raw_tech)

        supported_claims: List[str] = []
        inferred_claims: List[str] = []
        unknown_claims: List[str] = []

        if a6 and a6.findings:
            for f in a6.findings:
                status = f.status.lower()
                claim = f.claim
                if status == "supported":
                    supported_claims.append(claim)
                elif status == "inferred":
                    inferred_claims.append(claim)
                else:
                    unknown_claims.append(claim)

        # Audit Agent 1 claim verification against Agent 6
        if a1 and a1.product:
            claim_stat, claim_conf = resolve_tech_claim_conflict(
                claim_text=a1.product,
                pitch_deck_stated=True,
                agent6_status="supported" if supported_claims else "inferred",
                evidence_snippets=[f.claim for f in (a6.findings if a6 else [])],
            )
            if claim_conf:
                conflicts.append(claim_conf)

        tech_info = TechnicalInformation(
            repository_full_name=a6.repository.full_name if a6 and a6.repository else None,
            tech_stack_standardized=standardized_tech,
            code_maturity_rating="high" if len(supported_claims) >= 3 else ("moderate" if a6 else "early"),
            supported_feature_claims=supported_claims,
            inferred_feature_claims=inferred_claims,
            unsupported_or_unknown_claims=unknown_claims,
            technical_strengths=a6.raw_analysis.technical_strengths if a6 and a6.raw_analysis else [],
            technical_risks=a6.raw_analysis.technical_concerns if a6 and a6.raw_analysis else [],
            files_audited_count=a6.findings_summary.get("total_findings", 0) if a6 else 0,
            agent6_verified=bool(a6 is not None),
        )

        # ----------------------------------------------------------------------
        # 9. Project Information
        # ----------------------------------------------------------------------
        project_info = ProjectInformation(
            is_open_source=bool(a6 is not None),
            problem_statement=repo_problem or (a1.description if a1 else None),
            primary_solution=repo_solution or (a1.product if a1 else None),
            commercialization_readiness="high" if supported_claims and business_model else "moderate",
        )

        # Carry over Agent 1 fields from existing normalized profile if a1 was not in this run
        if not a1 and existing_norm:
            if existing_norm.get("financial_information") and isinstance(existing_norm["financial_information"], dict):
                try:
                    financial_info = FinancialInformation(**existing_norm["financial_information"])
                except Exception:
                    pass
            if existing_norm.get("team_information") and isinstance(existing_norm["team_information"], dict):
                try:
                    team_info = TeamInformation(**existing_norm["team_information"])
                except Exception:
                    pass
            if existing_norm.get("market_information") and isinstance(existing_norm["market_information"], dict):
                try:
                    market_info = MarketInformation(**existing_norm["market_information"])
                except Exception:
                    pass
            if existing_norm.get("traction_information") and isinstance(existing_norm["traction_information"], dict):
                try:
                    traction_info = TractionInformation(**existing_norm["traction_information"])
                except Exception:
                    pass

        # Carry over Agent 6 fields from existing normalized profile if a6 was not in this run
        if not a6 and existing_norm:
            if existing_norm.get("technical_information") and isinstance(existing_norm["technical_information"], dict):
                try:
                    tech_info = TechnicalInformation(**existing_norm["technical_information"])
                except Exception:
                    pass

        # ----------------------------------------------------------------------
        # 10. Data Validation Checks & Completeness Audit
        # ----------------------------------------------------------------------
        val_issues = validate_financial_metrics(
            arr=financial_info.annual_recurring_revenue,
            mrr=financial_info.monthly_recurring_revenue,
            burn_rate=financial_info.monthly_burn_rate,
            runway_months=financial_info.runway_months,
            gross_margin=financial_info.gross_margin_percentage,
            churn_rate=financial_info.churn_rate_percentage,
            cac=financial_info.cac,
            ltv=financial_info.ltv,
        )
        val_issues.extend(
            validate_market_sizing(
                tam_usd=market_info.tam_usd,
                sam_usd=market_info.sam_usd,
                som_usd=market_info.som_usd,
            )
        )

        missing_fields = audit_missing_fields(
            startup_name=startup_profile.canonical_name,
            description=startup_profile.description,
            industry=startup_profile.primary_industry,
            business_model=business_info.business_model,
            founders=team_info.founders,
            arr=financial_info.annual_recurring_revenue,
            burn_rate=financial_info.monthly_burn_rate,
            runway_months=financial_info.runway_months,
            tam_usd=market_info.tam_usd,
            tech_stack=tech_info.tech_stack_standardized,
            competitors=business_info.competitors,
        )

        # Consolidate all duplicate records
        all_duplicates = comp_dups + risk_dups + founder_dups

        # ----------------------------------------------------------------------
        # 11. Calculate Overall Confidence Score
        # ----------------------------------------------------------------------
        base_confidence = 0.88
        if not a6:
            base_confidence -= 0.08
        if not a1:
            base_confidence -= 0.08
        if any(m.importance == "critical" for m in missing_fields):
            base_confidence -= 0.10
        if any(i.severity == "error" for i in val_issues):
            base_confidence -= 0.05
        overall_confidence = max(0.40, min(0.99, round(base_confidence, 2)))

        # ----------------------------------------------------------------------
        # 12. Assemble Unified Master Dataset
        # ----------------------------------------------------------------------
        dataset = UnifiedStartupEvaluationDataset(
            id=norm_id,
            analysis_id=analysis_id,
            startup_id=request.startup_id,
            normalization_status="completed",
            overall_confidence_score=overall_confidence,
            startup_profile=startup_profile,
            business_information=business_info,
            financial_information=financial_info,
            team_information=team_info,
            traction_information=traction_info,
            market_information=market_info,
            technical_information=tech_info,
            project_information=project_info,
            external_research=ext.model_dump() if ext else {},
            normalized_metrics=tracker.get_normalized_metrics(),
            validation_results=val_issues,
            duplicate_records=all_duplicates,
            conflicts=conflicts,
            missing_fields=missing_fields,
            source_provenance=tracker.get_provenance_records(),
            metadata={
                "agent1_present": bool(a1 is not None),
                "agent6_present": bool(a6 is not None),
                "external_research_present": bool(ext is not None),
                "processed_at": now_iso,
            },
            created_at=now_iso,
        )

        # ----------------------------------------------------------------------
        # 13. Persistence: Local Storage & Supabase
        # ----------------------------------------------------------------------
        dataset_dict = dataset.model_dump()

        # Local storage (always succeeds)
        storage_service.save_normalized_output(analysis_id=analysis_id, data=dataset_dict)

        # Supabase storage (if enabled)
        if request.save_to_database and supabase_client.is_configured():
            db_record = {
                "id": norm_id,
                "analysis_id": analysis_id,
                "startup_id": request.startup_id or (existing_norm.get("startup_id") if existing_norm else None),
                "canonical_name": startup_profile.canonical_name,
                "primary_industry": startup_profile.primary_industry,
                "stage": startup_profile.stage,
                "normalization_status": "completed",
                "overall_confidence_score": overall_confidence,
                "startup_profile": dataset_dict["startup_profile"],
                "business_information": dataset_dict["business_information"],
                "financial_information": dataset_dict["financial_information"],
                "team_information": dataset_dict["team_information"],
                "traction_information": dataset_dict["traction_information"],
                "market_information": dataset_dict["market_information"],
                "technical_information": dataset_dict["technical_information"],
                "project_information": dataset_dict["project_information"],
                "external_research": dataset_dict["external_research"],
                "normalized_metrics": dataset_dict["normalized_metrics"],
                "validation_results": dataset_dict["validation_results"],
                "duplicate_records": dataset_dict["duplicate_records"],
                "conflicts": dataset_dict["conflicts"],
                "missing_fields": dataset_dict["missing_fields"],
                "source_provenance": dataset_dict["source_provenance"],
                "metadata": dataset_dict["metadata"],
                "schema_version": "1.0",
                "created_at": (existing_norm.get("created_at") if existing_norm else None) or now_iso,
                "updated_at": now_iso,
            }
            await supabase_client.save_normalized_profile(db_record)

        return dataset


normalization_service = NormalizationService()
