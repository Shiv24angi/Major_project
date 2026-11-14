"""Comprehensive Test Suite for Agent 2: Data Extraction & Normalization.

Tests all 14 core validation and normalization scenarios:
1. Currency normalization & multipliers ($1.2M, INR Lakhs, EUR, Cr)
2. Percentage normalization (24%, +15.5%, 0.24)
3. ISO 8601 date parsing & quarter notation
4. Runway months string normalization (18 months, 1.5 years)
5. Technology taxonomy canonicalization (reactjs -> React, nodejs -> Node.js)
6. Duplicate detection on competitors with corporate suffix stripping
7. Duplicate founder records consolidation
8. Conflict resolution: Agent 6 code ground-truth supersedes Agent 1 deck claim
9. Conflict resolution: External research market sizing priority
10. Cross-metric validation: ARR vs annualized MRR mismatch flag
11. Market sizing hierarchy validation: SAM > TAM and SOM > SAM
12. Unit economics audit: LTV/CAC ratio < 1.0 warning
13. Missing critical fields audit with downstream impact annotations
14. End-to-end normalization pipeline with provenance tracking and local storage
"""

import pytest
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
TEST_DIR = Path(__file__).resolve().parent
BACKEND_DIR = TEST_DIR.parent
AGENT2_DIR = BACKEND_DIR.parent

for p in [str(AGENT2_DIR), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.normalization.field_normalizer import (
    normalize_currency_and_amount,
    normalize_percentage,
    normalize_date,
    normalize_runway_months,
    normalize_tech_stack,
    normalize_stage,
    normalize_industry,
)
from backend.normalization.duplicate_detector import (
    deduplicate_string_list,
    deduplicate_competitors,
    deduplicate_founders,
)
from backend.normalization.conflict_resolver import (
    CandidateValue,
    resolve_metric_conflict,
    resolve_tech_claim_conflict,
)
from backend.normalization.data_validator import (
    validate_financial_metrics,
    validate_market_sizing,
    audit_missing_fields,
)
from backend.models.input_schemas import (
    NormalizationRequest,
    Agent1Payload,
    Agent1FinancialsInput,
    Agent1MarketSizeInput,
    Agent1FounderInput,
    Agent6Payload,
    Agent6FindingInput,
    Agent6RawAnalysisInput,
    Agent6RepositoryInput,
    ExternalResearchPayload,
    ExternalMarketResearchInput,
    ExternalFinancialResearchInput,
    ExternalCompetitorResearchInput,
)
from backend.services.normalization_service import normalization_service


# 1. Currency Normalization & Multipliers
def test_currency_normalization_multipliers():
    # Test USD Millions
    orig, curr, usd = normalize_currency_and_amount("$1.2M")
    assert orig == 1_200_000.0
    assert curr == "USD"
    assert usd == 1_200_000.0

    # Test INR Lakhs (50 Lakhs = 5,000,000 INR = 60,000 USD at 0.012 FX)
    orig_inr, curr_inr, usd_inr = normalize_currency_and_amount("₹50 Lakhs")
    assert orig_inr == 5_000_000.0
    assert curr_inr == "INR"
    assert usd_inr == 60_000.0

    # Test EUR Thousands (500k EUR = 500,000 EUR = 540,000 USD at 1.08 FX)
    orig_eur, curr_eur, usd_eur = normalize_currency_and_amount("€500k")
    assert orig_eur == 500_000.0
    assert curr_eur == "EUR"
    assert usd_eur == 540_000.0

    # Test Billions
    orig_b, curr_b, usd_b = normalize_currency_and_amount("10B")
    assert orig_b == 10_000_000_000.0
    assert curr_b == "USD"

    # Test Crores (5 Cr = 50,000,000 INR)
    orig_cr, curr_cr, _ = normalize_currency_and_amount("5 Cr")
    assert orig_cr == 50_000_000.0
    assert curr_cr == "INR"


# 2. Percentage Normalization
def test_percentage_normalization():
    assert normalize_percentage("24%") == 24.0
    assert normalize_percentage("+15.5%") == 15.5
    assert normalize_percentage("0.24") == 24.0
    assert normalize_percentage(0.24) == 24.0
    assert normalize_percentage("85.2") == 85.2
    assert normalize_percentage("unknown") is None


# 3. ISO 8601 Date Parsing
def test_date_normalization_iso8601():
    assert normalize_date("2025-09-06") == "2025-09-06"
    assert normalize_date("Sep 6, 2025") == "2025-09-06"
    assert normalize_date("September 2024") == "2024-09-01"
    assert normalize_date("2023") == "2023-01-01"
    assert normalize_date("Q3 2024") == "2024-07-01"


# 4. Runway Months Normalization
def test_runway_months_normalization():
    assert normalize_runway_months("18 months") == 18.0
    assert normalize_runway_months("1.5 years") == 18.0
    assert normalize_runway_months("6m") == 6.0
    assert normalize_runway_months(12) == 12.0
    assert normalize_runway_months("none") is None


# 5. Technology Taxonomy Standardization
def test_technology_taxonomy_standardization():
    raw_stack = ["react.js", "nodejs", "postgres", "k8s", "tailwind", "python3", "fastapi"]
    standardized = normalize_tech_stack(raw_stack)
    assert "React" in standardized
    assert "Node.js" in standardized
    assert "PostgreSQL" in standardized
    assert "Kubernetes" in standardized
    assert "Tailwind CSS" in standardized
    assert "Python" in standardized
    assert "FastAPI" in standardized


# 6. Duplicate Detection on Competitors
def test_duplicate_detection_competitors():
    sources = [
        (["Stripe", "Stripe Inc", "Adyen"], "agent1"),
        (["stripe", "PayPal"], "external_research"),
    ]
    unique, duplicates = deduplicate_competitors(sources)
    assert len(unique) == 3  # Stripe, Adyen, PayPal
    assert "Stripe" in unique
    assert len(duplicates) >= 2  # Stripe Inc and stripe consolidated


# 7. Duplicate Founder Records Consolidation
def test_duplicate_founder_records():
    raw_founders = [
        {"name": "Sarah Chen", "role": "CEO"},
        {"name": "sarah chen", "role": "Co-Founder"},
        {"name": "David Kumar", "role": "CTO"},
    ]
    unique, duplicates = deduplicate_founders(raw_founders)
    assert len(unique) == 2
    assert len(duplicates) == 1
    assert duplicates[0].field == "founders"


# 8. Conflict Resolution: Agent 6 Ground-Truth Supersedes Agent 1
def test_conflict_resolution_source_authority_tech():
    # Agent 1 claims proprietary ML model; Agent 6 found unsupported in AST
    status, conflict = resolve_tech_claim_conflict(
        claim_text="Custom Transformer NLP Engine",
        pitch_deck_stated=True,
        agent6_status="unknown",
        evidence_snippets=["No custom model architectures detected in repo"],
    )
    assert status == "unsupported"
    assert conflict is not None
    assert conflict.resolution_policy == "source_authority"
    assert "Agent 6 static codebase analysis" in conflict.resolution_rationale


# 9. Conflict Resolution: External Research Market Sizing Priority
def test_conflict_resolution_market_sizing():
    # Pitch deck claims $100B TAM; Market research reports $25B TAM
    candidates = [
        CandidateValue(source="agent1", value=100_000_000_000.0, confidence=0.7),
        CandidateValue(source="external_research", value=25_000_000_000.0, confidence=0.88),
    ]
    resolved, conflict = resolve_metric_conflict("tam_usd", "market_size", candidates)
    assert resolved == 25_000_000_000.0
    assert conflict is not None
    assert conflict.resolved_value == 25_000_000_000.0
    assert conflict.resolution_policy == "source_authority"


# 10. Cross-Metric Validation: ARR vs MRR Annualization Mismatch
def test_cross_metric_validation_arr_mrr_mismatch():
    # Reported ARR: $1,200,000; Reported MRR: $50,000 ($600,000 annualized) -> 50% discrepancy
    issues = validate_financial_metrics(
        arr=1_200_000.0,
        mrr=50_000.0,
        burn_rate=30_000.0,
        runway_months=18.0,
        gross_margin=75.0,
        churn_rate=2.0,
        cac=500.0,
        ltv=3000.0,
    )
    mismatch_issue = next((i for i in issues if i.rule == "ARR_MRR_ANNUALIZATION_MISMATCH"), None)
    assert mismatch_issue is not None
    assert mismatch_issue.severity == "warning"


# 11. Market Sizing Hierarchy Validation
def test_market_sizing_hierarchy_validation():
    # SAM ($30B) exceeds TAM ($20B)
    issues = validate_market_sizing(tam_usd=20_000_000_000.0, sam_usd=30_000_000_000.0, som_usd=5_000_000_000.0)
    sam_err = next((i for i in issues if i.rule == "SAM_EXCEEDS_TAM"), None)
    assert sam_err is not None
    assert sam_err.severity == "error"

    # SOM ($10B) exceeds SAM ($5B)
    issues2 = validate_market_sizing(tam_usd=50_000_000_000.0, sam_usd=5_000_000_000.0, som_usd=10_000_000_000.0)
    som_err = next((i for i in issues2 if i.rule == "SOM_EXCEEDS_SAM"), None)
    assert som_err is not None
    assert som_err.severity == "error"


# 12. Unit Economics Audit: LTV/CAC < 1.0 Warning
def test_unit_economics_validation():
    # CAC: $2,000; LTV: $1,000 -> ratio 0.5x
    issues = validate_financial_metrics(
        arr=100_000.0,
        mrr=None,
        burn_rate=20_000.0,
        runway_months=12.0,
        gross_margin=70.0,
        churn_rate=5.0,
        cac=2000.0,
        ltv=1000.0,
    )
    ltv_issue = next((i for i in issues if i.rule == "UNSUSTAINABLE_UNIT_ECONOMICS"), None)
    assert ltv_issue is not None
    assert ltv_issue.severity == "warning"


# 13. Missing Critical Fields Audit
def test_missing_fields_audit():
    missing = audit_missing_fields(
        startup_name="Acme AI",
        description="Autonomous testing agents",
        industry="Artificial Intelligence",
        business_model="B2B SaaS",
        founders=[],  # Missing founders
        arr=None,
        burn_rate=None,
        runway_months=None,
        tam_usd=None,
        tech_stack=["React", "Python"],
        competitors=[],
    )
    founder_miss = next((m for m in missing if m.field == "team_information.founders"), None)
    assert founder_miss is not None
    assert founder_miss.importance == "critical"
    assert "Team Scoring sub-pillar" in founder_miss.downstream_impact


# 14. Full Normalization Pipeline End-to-End
def test_full_normalization_pipeline_end_to_end():
    import asyncio
    req = NormalizationRequest(
        analysis_id="test_analysis_101",
        startup_name="CloudMatrix AI",
        save_to_database=False,
        enable_llm_disambiguation=False,
        agent1_data=Agent1Payload(
            startup_name="CloudMatrix AI",
            description="Enterprise API orchestration and security platform",
            industry="B2B SaaS",
            founders=[
                Agent1FounderInput(name="Alex Rivera", role="CEO", background="Ex-Google"),
                Agent1FounderInput(name="Dr. Elena Vance", role="CTO", background="PhD Systems"),
            ],
            financials=Agent1FinancialsInput(
                arr="$2.4M",
                mrr="$200k",
                burn_rate="$80k",
                runway="18 months",
                gross_margin="78%",
                cac="$2,500",
                ltv="$15,000",
            ),
            funding_raised="$4.5M",
            market_size=Agent1MarketSizeInput(tam="$15B", sam="$4B", som="$800M"),
            competitors=["Kong", "Apigee", "kong"],
            risks=["API security regulations", "Vendor lock-in"],
        ),
        agent6_data=Agent6Payload(
            github_url="https://github.com/cloudmatrix/core",
            repository=Agent6RepositoryInput(owner="cloudmatrix", name="core", full_name="cloudmatrix/core"),
            findings=[
                Agent6FindingInput(category="feature", claim="Distributed API gateway", status="supported"),
                Agent6FindingInput(category="architecture", claim="Microservices mesh", status="supported"),
            ],
            raw_analysis=Agent6RawAnalysisInput(
                project_name="core",
                technology_stack=["fastapi", "postgres", "docker", "reactjs"],
                problem_solved="Unified multi-cloud API traffic monitoring",
                technical_strengths=["Clean async Python", "PostgreSQL connection pooling"],
            ),
        ),
        external_research_data=ExternalResearchPayload(
            market_research=ExternalMarketResearchInput(
                tam="$18B",
                sam="$5B",
                som="$1B",
                cagr="21.5%",
                market_drivers=["Cloud adoption"],
            ),
            financial_research=ExternalFinancialResearchInput(
                estimated_burn_rate="$85k",
                runway_months=16,
            ),
            competitor_research=ExternalCompetitorResearchInput(
                competitors=[{"name": "Kong"}, {"name": "Tyk"}],
            ),
        ),
    )

    dataset = asyncio.run(normalization_service.normalize(req))

    assert dataset.analysis_id == "test_analysis_101"
    assert dataset.startup_profile.canonical_name == "CloudMatrix AI"
    assert dataset.financial_information.annual_recurring_revenue == 2_400_000.0
    assert dataset.financial_information.monthly_recurring_revenue == 200_000.0
    assert dataset.financial_information.gross_margin_percentage == 78.0
    assert dataset.financial_information.ltv_cac_ratio == 6.0
    assert dataset.financial_information.capital_efficiency_status == "healthy"
    assert dataset.team_information.technical_founder_present is True
    assert "FastAPI" in dataset.technical_information.tech_stack_standardized
    assert "React" in dataset.technical_information.tech_stack_standardized
    assert len(dataset.duplicate_records) >= 1  # 'kong' duplicate consolidated
    assert len(dataset.normalized_metrics) >= 1
    assert len(dataset.source_provenance) >= 1
    assert dataset.normalization_status == "completed"
    assert dataset.overall_confidence_score > 0.70
