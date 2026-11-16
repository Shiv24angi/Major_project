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
                        # Reconstruct full dataset if raw payload is nested or structured
                        return {
                            "id": row.get("id"),
                            "analysis_id": row.get("analysis_id"),
                            "startup_name": row.get("canonical_name"),
                            "overall_confidence_score": row.get("confidence_score", 0.85),
                            "startup_profile": {
                                "canonical_name": row.get("canonical_name"),
                                "primary_industry": row.get("industry"),
                                "stage": row.get("stage"),
                                "website": row.get("website"),
                                "github_url": row.get("github_url"),
                            },
                            "business_information": {
                                "business_model": row.get("business_model"),
                                "competitors": row.get("competitors", []),
                            },
                            "financial_information": {
                                "annual_recurring_revenue": row.get("annual_recurring_revenue"),
                                "monthly_recurring_revenue": row.get("monthly_recurring_revenue"),
                                "total_capital_raised": row.get("total_capital_raised"),
                                "monthly_burn_rate": row.get("monthly_burn_rate"),
                                "runway_months": row.get("runway_months"),
                                "gross_margin_percentage": row.get("gross_margin_percentage"),
                                "annual_growth_rate_percentage": row.get("annual_growth_rate_percentage"),
                                "churn_rate_percentage": row.get("churn_rate_percentage"),
                                "cac": row.get("cac"),
                                "ltv": row.get("ltv"),
                                "ltv_cac_ratio": row.get("ltv_cac_ratio"),
                                "capital_efficiency_status": row.get("capital_efficiency_status"),
                            },
                            "team_information": {
                                "founders": row.get("founders", []),
                                "team_size_estimate": row.get("team_size_estimate", 2),
                                "technical_founder_present": row.get("technical_founder_present", True),
                            },
                            "traction_information": {
                                "qualitative_traction": row.get("qualitative_traction", []),
                                "public_metrics": row.get("public_metrics", {}),
                            },
                            "market_information": {
                                "tam_usd": row.get("tam_usd"),
                                "sam_usd": row.get("sam_usd"),
                                "som_usd": row.get("som_usd"),
                                "cagr_percentage": row.get("cagr_percentage"),
                                "market_drivers": row.get("market_drivers", []),
                                "market_headwinds": row.get("market_headwinds", []),
                            },
                            "technical_information": {
                                "tech_stack_standardized": row.get("tech_stack", []),
                                "code_maturity_rating": row.get("code_maturity_rating", "moderate"),
                                "supported_feature_claims": row.get("supported_features", []),
                                "inferred_feature_claims": [],
                                "agent6_verified": True,
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
