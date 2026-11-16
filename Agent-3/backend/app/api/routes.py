"""API Router for Agent 3: Multi-Dimensional Startup Scoring Engine."""

import logging
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, Path

from models.scoring_models import Agent3ScoringRequest, Agent3ScoringResult
from scoring.engine import compute_startup_evaluation
from services.agent2_client import fetch_normalized_profile
from services.storage_service import save_scoring_result_locally
from services.supabase_client import save_agent3_evaluation

logger = logging.getLogger("agent3.api")

router = APIRouter(prefix="/api/v1/agent3", tags=["Agent 3 Scoring"])


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    return {
        "status": "online",
        "agent": "Agent 3 - Multi-Dimensional Scoring Engine",
        "version": "1.0.0",
        "dimensions": ["market", "product", "team", "financial", "traction", "risk"],
    }


@router.post("/score", response_model=Agent3ScoringResult)
async def score_startup(req: Agent3ScoringRequest) -> Agent3ScoringResult:
    """Computes calibrated multi-dimensional scores for a startup."""
    dataset = req.normalized_data

    # If dataset not directly provided, fetch via Agent 2 client
    if not dataset:
        dataset = await fetch_normalized_profile(req.analysis_id)
        if not dataset:
            raise HTTPException(
                status_code=404,
                detail=f"Normalized dataset not found for analysis_id: {req.analysis_id}. Ensure Agent 2 has executed.",
            )

    try:
        result = compute_startup_evaluation(
            data=dataset,
            analysis_id=req.analysis_id,
            startup_name=req.startup_name,
            mode=req.mode or "startup",
        )

        # Save locally
        save_scoring_result_locally(result.dict())

        # Save to Supabase (agent3_evaluations and analyses table)
        if req.save_to_database:
            await save_agent3_evaluation(result.dict())

        return result
    except Exception as e:
        logger.error(f"Error computing evaluation for {req.analysis_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Scoring engine error: {str(e)}")


@router.post("/score-analysis/{analysis_id}", response_model=Agent3ScoringResult)
async def score_analysis_by_id(analysis_id: str = Path(...)) -> Agent3ScoringResult:
    """Convenience trigger to score an existing analysis using upstream normalized data."""
    req = Agent3ScoringRequest(analysis_id=analysis_id)
    return await score_startup(req)
