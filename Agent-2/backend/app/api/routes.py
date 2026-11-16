"""API Endpoints for Agent 2: Data Extraction & Normalization.

Routes:
- POST /api/v1/agent2/normalize: Full normalization of Agent 1, Agent 6, & External Research.
- POST /api/v1/agent2/fetch-and-normalize: Auto-fetches inputs from siblings/Supabase and runs normalization.
- GET  /api/v1/agent2/{analysis_id}: Retrieve normalized dataset by analysis ID.
- GET  /api/v1/agent2/{analysis_id}/status: Inspect normalization status & summary.
- GET  /api/v1/agent2/runs: List all stored normalization runs.
- GET  /health: Service health check.
"""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from backend.models.input_schemas import NormalizationRequest
from backend.models.output_schemas import UnifiedStartupEvaluationDataset
from backend.services.normalization_service import normalization_service
from backend.services.storage_service import storage_service
from backend.services.supabase_client import supabase_client

logger = logging.getLogger("agent2.api")
router = APIRouter()


class FetchAndNormalizeRequest(BaseModel):
    analysis_id: str = Field(..., description="Unique analysis run ID")
    startup_name: Optional[str] = Field(default=None, description="Optional startup title")
    save_to_database: bool = Field(default=True, description="Save to Supabase")


@router.post("/normalize", response_model=UnifiedStartupEvaluationDataset, summary="Normalize startup evaluation data")
async def normalize_startup_data(request: NormalizationRequest) -> UnifiedStartupEvaluationDataset:
    """Normalize, validate, deduplicate, and resolve conflicts across Agent 1, Agent 6, and External Research."""
    try:
        dataset = await normalization_service.normalize(request)
        return dataset
    except Exception as e:
        logger.exception(f"Normalization failed for analysis {request.analysis_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Normalization pipeline error: {str(e)}")


@router.post("/fetch-and-normalize", response_model=UnifiedStartupEvaluationDataset, summary="Auto-fetch and normalize")
async def fetch_and_normalize(request: FetchAndNormalizeRequest) -> UnifiedStartupEvaluationDataset:
    """Auto-fetches latest Agent 1 and Agent 6 evals records from Supabase for analysis_id, then runs normalization."""
    norm_req = NormalizationRequest(
        analysis_id=request.analysis_id,
        startup_name=request.startup_name,
        save_to_database=request.save_to_database,
    )
    try:
        return await normalization_service.normalize(norm_req)
    except Exception as e:
        logger.exception(f"Auto-fetch normalization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync/agent1/{analysis_id}", response_model=UnifiedStartupEvaluationDataset, summary="Sync Agent 1 Pitch Deck Evals")
async def sync_agent1(analysis_id: str) -> UnifiedStartupEvaluationDataset:
    """Fetch Agent 1 pitch deck evaluation from public.agent1_evaluations, normalize, and update normalized_startup_profiles."""
    norm_req = NormalizationRequest(
        analysis_id=analysis_id,
        save_to_database=True,
    )
    try:
        return await normalization_service.normalize(norm_req)
    except Exception as e:
        logger.exception(f"Agent 1 sync failed for {analysis_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync/agent6/{analysis_id}", response_model=UnifiedStartupEvaluationDataset, summary="Sync Agent 6 Code Evals")
async def sync_agent6(analysis_id: str) -> UnifiedStartupEvaluationDataset:
    """Fetch Agent 6 repository diligence from public.agent6_evaluations, normalize, and update normalized_startup_profiles."""
    norm_req = NormalizationRequest(
        analysis_id=analysis_id,
        save_to_database=True,
    )
    try:
        return await normalization_service.normalize(norm_req)
    except Exception as e:
        logger.exception(f"Agent 6 sync failed for {analysis_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync/all/{analysis_id}", response_model=UnifiedStartupEvaluationDataset, summary="Sync all upstream evaluations")
async def sync_all_evaluations(analysis_id: str) -> UnifiedStartupEvaluationDataset:
    """Fetch both Agent 1 and Agent 6 evaluations from Supabase, harmonize, and update normalized_startup_profiles."""
    norm_req = NormalizationRequest(
        analysis_id=analysis_id,
        save_to_database=True,
    )
    try:
        return await normalization_service.normalize(norm_req)
    except Exception as e:
        logger.exception(f"All evaluations sync failed for {analysis_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{analysis_id}", response_model=Dict[str, Any], summary="Get normalized evaluation dataset")
async def get_normalized_dataset(analysis_id: str) -> Dict[str, Any]:
    """Retrieve the normalized startup evaluation dataset for a given analysis_id."""
    # 1. Try local storage
    record = storage_service.get_by_analysis_id(analysis_id)
    if record:
        return record

    # 2. Try Supabase
    record_db = await supabase_client.get_normalized_profile(analysis_id)
    if record_db:
        return record_db

    raise HTTPException(status_code=404, detail=f"No normalized profile found for analysis_id: {analysis_id}")


@router.get("/{analysis_id}/status", summary="Get normalization status and metrics summary")
async def get_normalization_status(analysis_id: str) -> Dict[str, Any]:
    """Inspect normalization completion status, confidence score, and issue counts."""
    record = storage_service.get_by_analysis_id(analysis_id)
    if not record and supabase_client.is_configured():
        record = await supabase_client.get_normalized_profile(analysis_id)

    if not record:
        raise HTTPException(status_code=404, detail=f"Analysis {analysis_id} not found")

    return {
        "analysis_id": analysis_id,
        "normalization_status": record.get("normalization_status", "unknown"),
        "overall_confidence_score": record.get("overall_confidence_score", 0.0),
        "validation_issues_count": len(record.get("validation_results", [])),
        "conflicts_count": len(record.get("conflicts", [])),
        "duplicates_count": len(record.get("duplicate_records", [])),
        "missing_fields_count": len(record.get("missing_fields", [])),
        "metrics_normalized_count": len(record.get("normalized_metrics", [])),
        "created_at": record.get("created_at"),
    }


@router.get("/runs/all", summary="List historical normalization runs")
async def list_runs() -> List[Dict[str, Any]]:
    """List indexed normalization runs from local storage."""
    return storage_service.list_runs()

