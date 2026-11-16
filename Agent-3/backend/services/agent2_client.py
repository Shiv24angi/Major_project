"""Agent 2 Client Service for Agent 3.

Fetches normalized startup profile produced by Agent 2 via:
1. Agent 2 HTTP REST API (port 8003)
2. Supabase `public.normalized_startup_profiles`
3. Local JSON Storage Fallback
"""

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("agent3.agent2_client")

AGENT2_API_URL = os.getenv("AGENT2_API_URL", "http://localhost:8003")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://kvcpmybvjllnddxzmnzr.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")


async def fetch_normalized_profile(analysis_id: str) -> Optional[Dict[str, Any]]:
    """Attempts multi-source retrieval of Agent 2 normalized dataset."""
    # 1. Try Agent 2 REST API
    try:
        url = f"{AGENT2_API_URL}/api/v1/agent2/{analysis_id}"
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                logger.info(f"Retrieved normalized profile from Agent 2 API for {analysis_id}")
                return resp.json()
    except Exception as e:
        logger.debug(f"Agent 2 API uncontactable on {AGENT2_API_URL}: {e}")

    # 2. Try Supabase normalized_startup_profiles
    if SUPABASE_KEY:
        try:
            url = f"{SUPABASE_URL}/rest/v1/normalized_startup_profiles?analysis_id=eq.{analysis_id}&order=created_at.desc&limit=1"
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
            }
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    rows = resp.json()
                    if rows and len(rows) > 0:
                        logger.info(f"Retrieved normalized profile from Supabase for {analysis_id}")
                        row = rows[0]
                        sp = row.get("startup_profile") if isinstance(row.get("startup_profile"), dict) else {}
                        bi = row.get("business_information") if isinstance(row.get("business_information"), dict) else {}
                        fi = row.get("financial_information") if isinstance(row.get("financial_information"), dict) else {}
                        ti = row.get("team_information") if isinstance(row.get("team_information"), dict) else {}
                        mi = row.get("market_information") if isinstance(row.get("market_information"), dict) else {}
                        techi = row.get("technical_information") if isinstance(row.get("technical_information"), dict) else {}
                        traci = row.get("traction_information") if isinstance(row.get("traction_information"), dict) else {}

                        # Reconstruct full dataset safely from nested JSONB objects
                        return {
                            "id": row.get("id"),
                            "analysis_id": row.get("analysis_id"),
                            "startup_name": sp.get("canonical_name") or row.get("canonical_name"),
                            "overall_confidence_score": row.get("confidence_score") or row.get("overall_confidence_score", 0.85),
                            "startup_profile": {
                                "canonical_name": sp.get("canonical_name") or row.get("canonical_name"),
                                "primary_industry": sp.get("primary_industry") or row.get("industry") or "Technology",
                                "stage": sp.get("stage") or row.get("stage") or "Seed",
                                "website": sp.get("website") or row.get("website"),
                                "github_url": sp.get("github_url") or row.get("github_url"),
                            },
                            "business_information": {
                                "business_model": bi.get("business_model") or row.get("business_model"),
                                "competitors": bi.get("competitors") or row.get("competitors", []),
                            },
                            "financial_information": {
                                "annual_recurring_revenue": fi.get("annual_recurring_revenue") if fi.get("annual_recurring_revenue") is not None else row.get("annual_recurring_revenue"),
                                "monthly_recurring_revenue": fi.get("monthly_recurring_revenue") if fi.get("monthly_recurring_revenue") is not None else row.get("monthly_recurring_revenue"),
                                "total_capital_raised": fi.get("total_capital_raised") or row.get("total_capital_raised"),
                                "monthly_burn_rate": fi.get("monthly_burn_rate") or row.get("monthly_burn_rate"),
                                "runway_months": fi.get("runway_months") or row.get("runway_months"),
                                "gross_margin_percentage": fi.get("gross_margin_percentage") or row.get("gross_margin_percentage"),
                                "annual_growth_rate_percentage": fi.get("annual_growth_rate_percentage") or row.get("annual_growth_rate_percentage"),
                                "churn_rate_percentage": fi.get("churn_rate_percentage") or row.get("churn_rate_percentage"),
                                "cac": fi.get("cac") or row.get("cac"),
                                "ltv": fi.get("ltv") or row.get("ltv"),
                                "ltv_cac_ratio": fi.get("ltv_cac_ratio") or row.get("ltv_cac_ratio"),
                                "capital_efficiency_status": fi.get("capital_efficiency_status") or row.get("capital_efficiency_status"),
                            },
                            "team_information": {
                                "founders": ti.get("founders") or row.get("founders", []),
                                "team_size_estimate": ti.get("team_size") or ti.get("team_size_estimate") or row.get("team_size_estimate", 2),
                                "technical_founder_present": ti.get("technical_founder_present") if ti.get("technical_founder_present") is not None else row.get("technical_founder_present", True),
                            },
                            "traction_information": {
                                "active_customers_count": traci.get("active_customers_count"),
                                "month_over_month_growth_percentage": traci.get("month_over_month_growth_percentage"),
                                "annual_churn_rate_percentage": traci.get("annual_churn_rate_percentage"),
                                "qualitative_traction": traci.get("qualitative_traction") or row.get("qualitative_traction", []),
                                "public_metrics": traci.get("public_metrics") or row.get("public_metrics", {}),
                            },
                            "market_information": {
                                "tam_usd": mi.get("tam_usd") if mi.get("tam_usd") is not None else row.get("tam_usd"),
                                "sam_usd": mi.get("sam_usd") if mi.get("sam_usd") is not None else row.get("sam_usd"),
                                "som_usd": mi.get("som_usd") if mi.get("som_usd") is not None else row.get("som_usd"),
                                "cagr_percentage": mi.get("cagr_percentage") if mi.get("cagr_percentage") is not None else row.get("cagr_percentage"),
                                "market_drivers": mi.get("market_drivers") or row.get("market_drivers", []),
                                "market_headwinds": mi.get("market_headwinds") or row.get("market_headwinds", []),
                            },
                            "technical_information": {
                                "tech_stack_standardized": techi.get("tech_stack_standardized") or row.get("tech_stack", []),
                                "code_maturity_rating": techi.get("code_maturity_rating") or row.get("code_maturity_rating", "moderate"),
                                "supported_feature_claims": techi.get("supported_feature_claims") or row.get("supported_features", []),
                                "inferred_feature_claims": techi.get("inferred_feature_claims", []),
                                "agent6_verified": techi.get("agent6_verified", True),
                            },
                            "conflicts": row.get("conflicts", []),
                            "missing_fields": row.get("missing_fields", []),
                        }
        except Exception as e:
            logger.debug(f"Failed Supabase normalized profile lookup: {e}")

    # 3. Try Local File Storage
    base_dir = Path(__file__).resolve().parent.parent.parent.parent
    candidate_paths = [
        base_dir / "Agent-2" / "backend" / "storage" / "normalized_outputs" / f"latest_{analysis_id}.json",
        base_dir / "Agent-2" / "backend" / "storage" / "normalized_outputs" / "latest.json",
    ]

    for p in candidate_paths:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    logger.info(f"Loaded normalized profile from local file: {p.name}")
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Error reading local normalized file {p}: {e}")

    return None
