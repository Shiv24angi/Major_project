"""Supabase Storage and Integration Client for Agent 2.

Handles direct persistence and retrieval of normalized startup profiles
to/from Supabase via PostgREST with zero heavy ORM overhead.
"""

import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from dotenv import load_dotenv
import httpx

# Ensure environment is loaded from Agent-2 .env or workspace root / Major_frontend
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env")
WORKSPACE_ROOT = BASE_DIR.parent.parent
if (WORKSPACE_ROOT / ".env").exists():
    load_dotenv(dotenv_path=WORKSPACE_ROOT / ".env")
FRONTEND_ENV = WORKSPACE_ROOT / "Major_frontend" / ".env"
if FRONTEND_ENV.exists():
    load_dotenv(dotenv_path=FRONTEND_ENV)

logger = logging.getLogger("agent2.supabase")


class SupabaseClient:
    def __init__(self):
        # Resolve Supabase URL from SUPABASE_URL or VITE_SUPABASE_URL
        self.supabase_url = (
            os.getenv("SUPABASE_URL")
            or os.getenv("VITE_SUPABASE_URL")
            or ""
        ).rstrip("/")

        # Resolve Supabase Anon/Service Key
        self.supabase_key = (
            os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            or os.getenv("SUPABASE_ANON_KEY")
            or os.getenv("VITE_SUPABASE_ANON_KEY")
            or ""
        )

    def is_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_key and "your_" not in self.supabase_key)

    def _headers(self, prefer_upsert: bool = False) -> Dict[str, str]:
        headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
        }
        if prefer_upsert:
            headers["Prefer"] = "resolution=merge-duplicates,return=representation"
        return headers

    async def save_normalized_profile(self, record: Dict[str, Any]) -> bool:
        """Persist or update normalized startup profile into public.normalized_startup_profiles.

        If a record already exists for the analysis_id, executes an in-place HTTP PATCH
        to update and merge fields; otherwise performs an HTTP POST.
        """
        if not self.is_configured():
            logger.info("Supabase credentials not configured. Skipping remote persistence.")
            return False

        analysis_id = record.get("analysis_id")
        table_url = f"{self.supabase_url}/rest/v1/normalized_startup_profiles"

        try:
            timeout = httpx.Timeout(5.0, connect=2.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                # 1. Check if an existing profile exists for this analysis_id
                existing = await self.get_normalized_profile(analysis_id) if analysis_id else None

                if existing and existing.get("id"):
                    target_id = existing["id"]
                    record["id"] = target_id
                    # Patch the existing record in Supabase
                    patch_url = f"{table_url}?id=eq.{target_id}"
                    headers = self._headers()
                    headers["Prefer"] = "return=representation"
                    resp = await client.patch(patch_url, headers=headers, json=record)
                    if resp.status_code in (200, 204):
                        logger.info(f"Successfully updated normalized profile {target_id} for analysis {analysis_id} in Supabase.")
                        return True
                    else:
                        logger.warning(f"Supabase PATCH returned {resp.status_code}: {resp.text}, attempting POST fallback")

                # 2. If not existing or PATCH returned fallback, execute POST upsert
                resp = await client.post(
                    table_url,
                    headers=self._headers(prefer_upsert=True),
                    json=record,
                )
                if resp.status_code in (200, 201, 204):
                    logger.info(f"Successfully persisted normalized profile {record.get('id')} to Supabase.")
                    return True
                else:
                    logger.warning(f"Supabase write returned {resp.status_code}: {resp.text}")
                    return False
        except (httpx.ConnectError, httpx.ConnectTimeout) as e:
            logger.debug(f"Supabase network unavailable ({e}). Skipping remote write.")
            return False
        except Exception as e:
            logger.warning(f"Error persisting normalized profile to Supabase: {e}")
            return False

    async def get_normalized_profile(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve normalized profile for an analysis_id."""
        if not self.is_configured():
            return None

        table_url = f"{self.supabase_url}/rest/v1/normalized_startup_profiles?analysis_id=eq.{analysis_id}&order=created_at.desc&limit=1"
        try:
            timeout = httpx.Timeout(4.0, connect=1.5)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.get(table_url, headers=self._headers())
                if resp.status_code == 200:
                    records = resp.json()
                    if records and len(records) > 0:
                        return records[0]
        except Exception as e:
            logger.warning(f"Error fetching normalized profile from Supabase: {e}")
        return None

    # --------------------------------------------------------------------------
    # UPSTREAM INPUT FETCHING & EXTRACTION
    # --------------------------------------------------------------------------

    async def fetch_agent1_evaluation(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Fetch Agent 1 document diligence evaluation from public.agent1_evaluations."""
        if not self.is_configured() or not analysis_id:
            return None

        try:
            timeout = httpx.Timeout(4.0, connect=1.5)
            async with httpx.AsyncClient(timeout=timeout) as client:
                # 1. Try agent1_evaluations table
                url = f"{self.supabase_url}/rest/v1/agent1_evaluations?analysis_id=eq.{analysis_id}&order=created_at.desc&limit=1"
                resp = await client.get(url, headers=self._headers())
                if resp.status_code == 200:
                    recs = resp.json()
                    if recs and len(recs) > 0:
                        return self._format_agent1_payload(recs[0])

                # 2. Fallback to evaluations table if legacy name was used
                url_fallback = f"{self.supabase_url}/rest/v1/evaluations?analysis_id=eq.{analysis_id}&order=created_at.desc&limit=1"
                resp_fb = await client.get(url_fallback, headers=self._headers())
                if resp_fb.status_code == 200:
                    recs = resp_fb.json()
                    if recs and len(recs) > 0:
                        return self._format_agent1_payload(recs[0])
        except Exception as e:
            logger.warning(f"Error fetching Agent 1 evaluation from Supabase for {analysis_id}: {e}")

        return None

    def _format_agent1_payload(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Convert an agent1_evaluations row into an Agent1Payload-compatible dictionary."""
        merged = record.get("merged_analysis") or {}
        doc_analyses = record.get("document_analyses") or []
        first_doc = doc_analyses[0] if (isinstance(doc_analyses, list) and len(doc_analyses) > 0 and isinstance(doc_analyses[0], dict)) else {}

        # Canonical name resolution
        startup_name = (
            merged.get("startup_name")
            or record.get("company_name")
            or first_doc.get("startup_name")
            or first_doc.get("company_name")
            or "Evaluated Startup"
        )

        # Financials extraction
        fin_raw = merged.get("financials") or first_doc.get("financials") or {}
        if not isinstance(fin_raw, dict):
            fin_raw = {}

        # Market size extraction
        mkt_raw = merged.get("market_size") or first_doc.get("market_size") or {}
        if not isinstance(mkt_raw, dict):
            mkt_raw = {}

        # Founders extraction & normalization
        raw_founders = merged.get("founders") or first_doc.get("founders") or []
        formatted_founders = []
        if isinstance(raw_founders, list):
            for f in raw_founders:
                if isinstance(f, dict):
                    formatted_founders.append({
                        "name": f.get("name") or f.get("founder_name") or "",
                        "role": f.get("role") or f.get("title") or "Founder",
                        "background": f.get("background") or f.get("bio") or "",
                    })
                elif isinstance(f, str) and f.strip():
                    formatted_founders.append({
                        "name": f.strip(),
                        "role": "Founder",
                        "background": "",
                    })

        # Competitors & risks
        competitors = merged.get("competitors") or first_doc.get("competitors") or []
        if not isinstance(competitors, list):
            competitors = [str(competitors)] if competitors else []

        risks = merged.get("risks") or first_doc.get("risks") or []
        if not isinstance(risks, list):
            risks = [str(risks)] if risks else []

        # Source files
        source_files = record.get("uploaded_files") or merged.get("source_files") or []
        formatted_files = []
        if isinstance(source_files, list):
            for sf in source_files:
                if isinstance(sf, dict):
                    formatted_files.append(sf.get("original_filename") or sf.get("name") or sf.get("file_path") or str(sf))
                elif isinstance(sf, str):
                    formatted_files.append(sf)

        return {
            "startup_name": startup_name,
            "description": merged.get("description") or first_doc.get("description"),
            "industry": merged.get("industry") or first_doc.get("industry") or "Technology",
            "sector": merged.get("sector") or first_doc.get("sector"),
            "founders": formatted_founders,
            "product": merged.get("product") or first_doc.get("product"),
            "business_model": merged.get("business_model") or first_doc.get("business_model"),
            "target_customers": merged.get("target_customers") or first_doc.get("target_customers"),
            "financials": fin_raw,
            "funding_raised": merged.get("funding_raised") or first_doc.get("funding_raised"),
            "investors": merged.get("investors") or first_doc.get("investors") or [],
            "customers": merged.get("customers") or first_doc.get("customers"),
            "traction": merged.get("traction") or first_doc.get("traction"),
            "market_size": mkt_raw,
            "competitors": competitors,
            "risks": risks,
            "key_metrics": merged.get("key_metrics") or first_doc.get("key_metrics") or {},
            "missing_information": merged.get("missing_information") or first_doc.get("missing_information") or [],
            "contradictions": record.get("contradictions") or merged.get("contradictions") or [],
            "source_files": formatted_files,
        }

    async def fetch_agent6_evaluation(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Fetch Agent 6 code diligence evaluation from public.agent6_evaluations."""
        if not self.is_configured() or not analysis_id:
            return None

        try:
            timeout = httpx.Timeout(4.0, connect=1.5)
            async with httpx.AsyncClient(timeout=timeout) as client:
                # 1. Query by analysis_id
                url = f"{self.supabase_url}/rest/v1/agent6_evaluations?analysis_id=eq.{analysis_id}&order=created_at.desc&limit=1"
                resp = await client.get(url, headers=self._headers())
                if resp.status_code == 200:
                    recs = resp.json()
                    if recs and len(recs) > 0:
                        return self._format_agent6_payload(recs[0], analysis_id)

                # 2. Query by run_id if analysis_id might be a run_id or prefixed
                url_run = f"{self.supabase_url}/rest/v1/agent6_evaluations?run_id=eq.{analysis_id}&limit=1"
                resp_run = await client.get(url_run, headers=self._headers())
                if resp_run.status_code == 200:
                    recs = resp_run.json()
                    if recs and len(recs) > 0:
                        return self._format_agent6_payload(recs[0], analysis_id)

                # 3. Query public.analyses for embedded agent6_data or code_details
                url_analyses = f"{self.supabase_url}/rest/v1/analyses?id=eq.{analysis_id}&select=id,title,agent6_data,code_details&limit=1"
                resp_ana = await client.get(url_analyses, headers=self._headers())
                if resp_ana.status_code == 200:
                    recs = resp_ana.json()
                    if recs and len(recs) > 0:
                        a_row = recs[0]
                        a6_data = a_row.get("agent6_data") or a_row.get("code_details")
                        if a6_data and isinstance(a6_data, dict):
                            return self._format_agent6_payload(a6_data, analysis_id)
        except Exception as e:
            logger.warning(f"Error fetching Agent 6 evaluation from Supabase for {analysis_id}: {e}")

        return None

    def _format_agent6_payload(self, record: Dict[str, Any], analysis_id: str = "") -> Dict[str, Any]:
        """Convert an agent6_evaluations row into an Agent6Payload-compatible dictionary."""
        owner = record.get("repository_owner") or ""
        name = record.get("repository_name") or ""
        repo_dict = record.get("repository") or {}
        if isinstance(repo_dict, dict):
            owner = owner or repo_dict.get("owner") or ""
            name = name or repo_dict.get("name") or ""

        full_name = f"{owner}/{name}" if owner and name else (name or owner or "project/repository")
        github_url = record.get("github_url") or f"https://github.com/{full_name}"

        # Raw analysis
        raw_analysis = record.get("raw_analysis") or {}
        if not isinstance(raw_analysis, dict):
            raw_analysis = {}

        # Findings
        findings_raw = record.get("findings") or []
        formatted_findings = []
        if isinstance(findings_raw, list):
            for f in findings_raw:
                if isinstance(f, dict):
                    claim = f.get("claim") or f.get("feature") or f.get("technology") or ""
                    category = f.get("category") or "feature"
                    status = f.get("status") or "supported"
                    evidence = f.get("evidence") or []
                    if isinstance(evidence, str):
                        evidence = [evidence]
                    elif not isinstance(evidence, list):
                        evidence = []
                    formatted_findings.append({
                        "category": category,
                        "claim": claim,
                        "status": status,
                        "evidence": [str(e) for e in evidence],
                    })

        return {
            "version": "1.0",
            "run_id": record.get("run_id") or f"agent6_{analysis_id or 'run'}",
            "github_url": github_url,
            "repository": {
                "owner": owner,
                "name": name,
                "full_name": full_name,
            },
            "findings_summary": record.get("findings_summary") or {},
            "findings": formatted_findings,
            "raw_analysis": raw_analysis,
            "metadata": record.get("metadata") or {},
        }

    async def fetch_research_evaluation(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Fetch external research evaluation from public.research_evaluations."""
        if not self.is_configured() or not analysis_id:
            return None

        try:
            timeout = httpx.Timeout(4.0, connect=1.5)
            async with httpx.AsyncClient(timeout=timeout) as client:
                url = f"{self.supabase_url}/rest/v1/research_evaluations?analysis_id=eq.{analysis_id}&order=created_at.desc&limit=1"
                resp = await client.get(url, headers=self._headers())
                if resp.status_code == 200:
                    recs = resp.json()
                    if recs and len(recs) > 0:
                        row = recs[0]
                        return {
                            "market_research": row.get("market_research") or {},
                            "competitor_research": row.get("competitor_research") or {},
                            "financial_research": row.get("financial_research") or {},
                            "news_research": row.get("news_research") or [],
                            "evidence_sources": row.get("evidence_sources") or [],
                            "overall_confidence": row.get("overall_confidence", 0.80),
                        }
        except Exception as e:
            logger.warning(f"Error fetching external research from Supabase for {analysis_id}: {e}")

        return None

    async def fetch_upstream_evaluations(
        self, analysis_id: str
    ) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """Fetch existing Agent 1, Agent 6, and External Research evaluations from Supabase for this analysis_id."""
        if not self.is_configured() or not analysis_id or analysis_id.startswith("test_"):
            return None, None, None

        a1_data = await self.fetch_agent1_evaluation(analysis_id)
        a6_data = await self.fetch_agent6_evaluation(analysis_id)
        ext_data = await self.fetch_research_evaluation(analysis_id)

        return a1_data, a6_data, ext_data


supabase_client = SupabaseClient()
