"""API Router for Agent 4: Insight & Recommendation Generator."""

import logging
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, Path

from generator.engine import compute_recommendations_and_insights
from models.recommendation_models import Agent4RecommendationRequest, Agent4RecommendationResult
from services.agent3_client import fetch_upstream_data
from services.storage_service import save_recommendation_locally
from services.supabase_client import save_agent4_recommendations

logger = logging.getLogger("agent4.api")

router = APIRouter(prefix="/api/v1/agent4", tags=["Agent 4 Recommendations"])


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    return {
        "status": "online",
        "agent": "Agent 4 - Insight & Recommendation Generator",
        "port": 8005,
        "capabilities": [
            "investment_thesis",
            "key_strengths",
            "risks_and_concerns",
            "growth_opportunities",
            "actionable_next_steps",
            "due_diligence_questions",
        ],
    }


@router.post("/generate", response_model=Agent4RecommendationResult)
async def generate_recommendations(req: Agent4RecommendationRequest) -> Agent4RecommendationResult:
    """Generates the investment thesis, key insights, and due diligence questions."""
    scoring = req.scoring_data
    norm = req.normalized_data

    # Auto-fetch if not provided in payload
    if not scoring or not norm:
        fetched_scoring, fetched_norm = await fetch_upstream_data(req.analysis_id)
        scoring = scoring or fetched_scoring
        norm = norm or fetched_norm

    try:
        result = await compute_recommendations_and_insights(
            analysis_id=req.analysis_id,
            startup_name=req.startup_name,
            scoring_data=scoring,
            normalized_data=norm,
        )

        # Save locally
        save_recommendation_locally(result.dict())

        # Save to Supabase (analyses table and agent4_recommendations)
        if req.save_to_database:
            await save_agent4_recommendations(result.dict())

        return result
    except Exception as e:
        logger.error(f"Error generating recommendations for {req.analysis_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Recommendation engine error: {str(e)}")


@router.post("/generate-analysis/{analysis_id}", response_model=Agent4RecommendationResult)
async def generate_analysis_by_id(analysis_id: str = Path(...)) -> Agent4RecommendationResult:
    """Convenience trigger to run Agent 4 on an existing analysis."""
    req = Agent4RecommendationRequest(analysis_id=analysis_id)
    return await generate_recommendations(req)
