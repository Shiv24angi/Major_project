"""Supabase Client for Agent 4.

Persists recommendations and insights to:
1. `public.agent4_recommendations`
2. `public.analyses` (updates thesis, key_insights, due_diligence_questions, recommendation, confidence)
"""

import logging
import os
from typing import Any, Dict
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("agent4.supabase")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://kvcpmybvjllnddxzmnzr.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")


def get_headers() -> Dict[str, str]:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


async def save_agent4_recommendations(rec_data: Dict[str, Any]) -> bool:
    """Saves recommendation and updates analyses table."""
    if not SUPABASE_KEY:
        logger.warning("SUPABASE_KEY not configured. Skipping persistence.")
        return False

    analysis_id = rec_data.get("analysis_id")
    if not analysis_id:
        return False

    headers = get_headers()
    success = True

    # 1. Update public.analyses with thesis, key_insights, and due_diligence_questions
    try:
        update_url = f"{SUPABASE_URL}/rest/v1/analyses?id=eq.{analysis_id}"
        patch_payload = {
            "thesis": rec_data.get("investment_thesis"),
            "recommendation": rec_data.get("recommendation", "MONITOR"),
            "confidence": rec_data.get("confidence", "High"),
            "key_insights": rec_data.get("key_insights", {}),
            "due_diligence_questions": rec_data.get("due_diligence_questions", []),
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.patch(update_url, headers=headers, json=patch_payload)
            if resp.status_code in (200, 204):
                logger.info(f"Successfully updated public.analyses for {analysis_id}")
            else:
                logger.warning(f"Could not patch analyses (status {resp.status_code}): {resp.text}")
                success = False
    except Exception as e:
        logger.error(f"Error updating public.analyses: {e}")
        success = False

    # 2. Insert into public.agent4_recommendations
    try:
        url = f"{SUPABASE_URL}/rest/v1/agent4_recommendations"
        agent4_payload = {
            "id": rec_data.get("id"),
            "analysis_id": analysis_id,
            "startup_name": rec_data.get("startup_name", "Startup Evaluation"),
            "recommendation": rec_data.get("recommendation", "MONITOR"),
            "recommendation_label": rec_data.get("recommendation_label"),
            "confidence": rec_data.get("confidence", "High"),
            "investment_thesis": rec_data.get("investment_thesis", ""),
            "key_strengths": (rec_data.get("key_insights") or {}).get("strengths", []),
            "risks_and_concerns": (rec_data.get("key_insights") or {}).get("risks", []),
            "growth_opportunities": (rec_data.get("key_insights") or {}).get("opportunities", []),
            "actionable_next_steps": (rec_data.get("key_insights") or {}).get("nextSteps", []),
            "due_diligence_questions": rec_data.get("due_diligence_questions", []),
            "overall_score": rec_data.get("overall_score", 75),
            "dimension_scores": rec_data.get("dimension_scores", {}),
            "generation_source": rec_data.get("generation_source", "gemini_and_rules"),
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=agent4_payload)
            if resp.status_code in (200, 201):
                logger.info(f"Successfully saved to public.agent4_recommendations: {rec_data.get('id')}")
            else:
                logger.debug(f"agent4_recommendations insert returned {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.debug(f"Network error persisting to agent4_recommendations: {e}")

    return success
