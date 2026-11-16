"""Supabase Client for Agent 3.

Persists scoring results to:
1. `public.agent3_evaluations`
2. `public.analyses` (updates overall_score, recommendation, confidence, and scores JSON)
"""

import logging
import os
from typing import Any, Dict, Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("agent3.supabase")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://kvcpmybvjllnddxzmnzr.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")


def get_headers() -> Dict[str, str]:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


async def save_agent3_evaluation(scoring_data: Dict[str, Any]) -> bool:
    """Saves scoring result into public.agent3_evaluations and updates public.analyses."""
    if not SUPABASE_KEY:
        logger.warning("SUPABASE_KEY not configured. Skipping database persistence.")
        return False

    analysis_id = scoring_data.get("analysis_id")
    if not analysis_id:
        logger.warning("No analysis_id provided in scoring data.")
        return False

    headers = get_headers()
    success = True

    # 1. Insert into public.agent3_evaluations
    agent3_payload = {
        "id": scoring_data.get("id"),
        "analysis_id": analysis_id,
        "startup_name": scoring_data.get("startup_name", "Startup Evaluation"),
        "overall_score": scoring_data.get("overall_score", 75),
        "market_score": scoring_data.get("market_score", 75),
        "product_score": scoring_data.get("product_score", 75),
        "team_score": scoring_data.get("team_score", 75),
        "financial_score": scoring_data.get("financial_score", 75),
        "traction_score": scoring_data.get("traction_score", 75),
        "risk_score": scoring_data.get("risk_score", 75),
        "recommendation": scoring_data.get("recommendation", "MONITOR"),
        "confidence": scoring_data.get("confidence", "High"),
        "confidence_score": scoring_data.get("confidence_score", 0.85),
        "dimension_breakdowns": scoring_data.get("dimensions", {}),
        "scoring_rationale": {
            "summary": scoring_data.get("scoring_summary", ""),
        },
        "key_drivers": scoring_data.get("key_drivers", []),
        "risk_penalties": scoring_data.get("key_risks", []),
        "metadata": {
            "agent2_normalized_id": scoring_data.get("agent2_normalized_id"),
            "schema_version": scoring_data.get("schema_version", "1.0"),
            "mode": scoring_data.get("mode", "startup"),
        },
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        # A. Upsert into agent3_evaluations
        try:
            url = f"{SUPABASE_URL}/rest/v1/agent3_evaluations"
            resp = await client.post(url, headers=headers, json=agent3_payload)
            if resp.status_code in (200, 201):
                logger.info(f"Successfully saved to public.agent3_evaluations: {scoring_data.get('id')}")
            else:
                logger.warning(f"Could not insert into agent3_evaluations (status {resp.status_code}): {resp.text}")
        except Exception as e:
            logger.warning(f"Network error persisting to agent3_evaluations: {e}")

        # B. Update public.analyses with calibrated scores and recommendation
        try:
            update_url = f"{SUPABASE_URL}/rest/v1/analyses?id=eq.{analysis_id}"
            analyses_patch = {
                "overall_score": scoring_data.get("overall_score", 75),
                "recommendation": scoring_data.get("recommendation", "MONITOR"),
                "confidence": scoring_data.get("confidence", "High"),
                "scores": {
                    "market": scoring_data.get("market_score", 75),
                    "product": scoring_data.get("product_score", 75),
                    "team": scoring_data.get("team_score", 75),
                    "financial": scoring_data.get("financial_score", 75),
                    "traction": scoring_data.get("traction_score", 75),
                    "risk": scoring_data.get("risk_score", 75),
                    "overall": scoring_data.get("overall_score", 75),
                },
                "thesis": scoring_data.get("scoring_summary"),
            }
            patch_resp = await client.patch(update_url, headers=headers, json=analyses_patch)
            if patch_resp.status_code in (200, 204):
                logger.info(f"Successfully updated public.analyses for analysis_id: {analysis_id}")
            else:
                logger.warning(f"Could not update public.analyses (status {patch_resp.status_code}): {patch_resp.text}")
                success = False
        except Exception as e:
            logger.error(f"Failed to update public.analyses: {e}")
            success = False

    return success
