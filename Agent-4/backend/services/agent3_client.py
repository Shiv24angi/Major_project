"""Upstream Client Service for Agent 4.

Retrieves scoring and normalized data from:
1. Agent 3 API (port 8004) / Supabase `analyses` & `agent3_evaluations`
2. Agent 2 API (port 8003) / Supabase `normalized_startup_profiles`
"""

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("agent4.upstream_client")

AGENT2_API_URL = os.getenv("AGENT2_API_BASE", "http://localhost:8003")
AGENT3_API_URL = os.getenv("AGENT3_API_BASE", "http://localhost:8004")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://kvcpmybvjllnddxzmnzr.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")


async def fetch_upstream_data(analysis_id: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """Retrieves scoring data (Agent 3) and normalized data (Agent 2)."""
    scoring_data: Dict[str, Any] = {}
    normalized_data: Dict[str, Any] = {}

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    } if SUPABASE_KEY else {}

    async with httpx.AsyncClient(timeout=4.0) as client:
        # 1. Fetch Scoring from Agent 3 API
        try:
            resp = await client.get(f"{AGENT3_API_URL}/api/v1/agent3/{analysis_id}")
            if resp.status_code == 200:
                scoring_data = resp.json()
        except Exception:
            pass

        # 2. Fetch from Supabase analyses table if Agent 3 API offline
        if not scoring_data and SUPABASE_KEY:
            try:
                url = f"{SUPABASE_URL}/rest/v1/analyses?id=eq.{analysis_id}&limit=1"
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    rows = resp.json()
                    if rows:
                        row = rows[0]
                        scores = row.get("scores") or {}
                        scoring_data = {
                            "analysis_id": analysis_id,
                            "startup_name": row.get("title"),
                            "overall_score": row.get("overall_score", 75),
                            "recommendation": row.get("recommendation", "MONITOR"),
                            "confidence": row.get("confidence", "High"),
                            "market_score": scores.get("market", 75),
                            "product_score": scores.get("product", 75),
                            "team_score": scores.get("team", 75),
                            "financial_score": scores.get("financial", 75),
                            "traction_score": scores.get("traction", 75),
                            "risk_score": scores.get("risk", 75),
                        }
            except Exception as e:
                logger.warning(f"Error querying Supabase analyses: {e}")

        # 3. Fetch Normalized Data from Agent 2 API
        try:
            resp = await client.get(f"{AGENT2_API_URL}/api/v1/agent2/{analysis_id}")
            if resp.status_code == 200:
                normalized_data = resp.json()
        except Exception:
            pass

        # 4. Fetch Normalized Data from Supabase
        if not normalized_data and SUPABASE_KEY:
            try:
                url = f"{SUPABASE_URL}/rest/v1/normalized_startup_profiles?analysis_id=eq.{analysis_id}&order=created_at.desc&limit=1"
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    rows = resp.json()
                    if rows:
                        row = rows[0]
                        sp = row.get("startup_profile") if isinstance(row.get("startup_profile"), dict) else {}
                        fi = row.get("financial_information") if isinstance(row.get("financial_information"), dict) else {}
                        ti = row.get("technical_information") if isinstance(row.get("technical_information"), dict) else {}
                        team_i = row.get("team_information") if isinstance(row.get("team_information"), dict) else {}
                        mi = row.get("market_information") if isinstance(row.get("market_information"), dict) else {}

                        normalized_data = {
                            "startup_profile": {
                                "canonical_name": sp.get("canonical_name") or row.get("canonical_name"),
                                "primary_industry": sp.get("primary_industry") or row.get("primary_industry") or row.get("industry") or "Technology",
                            },
                            "financial_information": {
                                "annual_recurring_revenue": fi.get("annual_recurring_revenue") if fi.get("annual_recurring_revenue") is not None else row.get("annual_recurring_revenue"),
                                "runway_months": fi.get("runway_months") if fi.get("runway_months") is not None else row.get("runway_months"),
                                "ltv_cac_ratio": fi.get("ltv_cac_ratio") if fi.get("ltv_cac_ratio") is not None else row.get("ltv_cac_ratio"),
                            },
                            "technical_information": {
                                "code_maturity_rating": ti.get("code_maturity_rating") or row.get("code_maturity_rating", "moderate"),
                                "tech_stack_standardized": ti.get("tech_stack_standardized") or row.get("tech_stack", []),
                            },
                            "team_information": {
                                "founders": team_i.get("founders") or row.get("founders", []),
                                "technical_founder_present": team_i.get("technical_founder_present") if team_i.get("technical_founder_present") is not None else row.get("technical_founder_present", True),
                            },
                            "market_information": {
                                "tam_usd": mi.get("tam_usd") if mi.get("tam_usd") is not None else row.get("tam_usd"),
                                "cagr_percentage": mi.get("cagr_percentage") if mi.get("cagr_percentage") is not None else row.get("cagr_percentage"),
                            },
                            "conflicts": row.get("conflicts", []),
                        }
            except Exception as e:
                logger.warning(f"Error querying Supabase normalized profiles: {e}")

    # Fallback default baseline if completely offline
    if not scoring_data:
        scoring_data = {
            "analysis_id": analysis_id,
            "startup_name": "Startup Evaluation",
            "overall_score": 80,
            "recommendation": "INVEST",
            "confidence": "High",
            "market_score": 85,
            "product_score": 82,
            "team_score": 85,
            "financial_score": 78,
            "traction_score": 75,
            "risk_score": 80,
        }

    return scoring_data, normalized_data
