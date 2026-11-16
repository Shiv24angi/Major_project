"""Data Models and Schemas for Agent 3: Analytical Scoring Engine.

Defines request/response contracts for multi-dimensional startup scoring.
"""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class DimensionScore(BaseModel):
    name: str
    score: int = Field(..., ge=0, le=100, description="Calibrated score between 0 and 100")
    weight: float = Field(..., description="Weight contribution in overall calculation")
    weighted_score: float = Field(..., description="score * weight")
    status: Literal["exceptional", "strong", "moderate", "weak", "distressed"]
    rationale: str
    positive_signals: List[str] = Field(default_factory=list)
    risk_factors: List[str] = Field(default_factory=list)


class Agent3ScoringResult(BaseModel):
    id: str
    analysis_id: str
    startup_name: str
    mode: Literal["startup", "project"] = "startup"
    
    # 6 Core Evaluated Dimensions
    overall_score: int = Field(..., ge=0, le=100)
    market_score: int = Field(..., ge=0, le=100)
    product_score: int = Field(..., ge=0, le=100)
    team_score: int = Field(..., ge=0, le=100)
    financial_score: int = Field(..., ge=0, le=100)
    traction_score: int = Field(..., ge=0, le=100)
    risk_score: int = Field(..., ge=0, le=100)

    # Investment Decision Output
    recommendation: Literal["INVEST", "MONITOR", "MAYBE", "PASS"]
    recommendation_label: str
    confidence: Literal["High", "Moderate", "Low"]
    confidence_score: float = Field(default=0.85, ge=0.0, le=1.0)
    
    # Granular Breakdown
    dimensions: Dict[str, DimensionScore] = Field(default_factory=dict)
    key_drivers: List[str] = Field(default_factory=list)
    key_risks: List[str] = Field(default_factory=list)
    scoring_summary: str
    
    # Source & Execution Lineage
    agent2_normalized_id: Optional[str] = None
    created_at: str
    schema_version: str = "1.0"


class Agent3ScoringRequest(BaseModel):
    analysis_id: str = Field(..., description="Unique ID linking Agent 1, 6, 2, and 3")
    startup_name: Optional[str] = None
    mode: Optional[Literal["startup", "project"]] = "startup"
    normalized_data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional pre-fetched Agent 2 UnifiedStartupEvaluationDataset"
    )
    save_to_database: bool = Field(default=True, description="Persist scores to Supabase public.analyses")
