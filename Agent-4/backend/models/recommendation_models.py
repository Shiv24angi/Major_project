"""Data Models and Contracts for Agent 4: Insight & Recommendation Generator."""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class DueDiligenceQuestion(BaseModel):
    id: str
    question: str
    category: str = Field(..., description="E.g. Technical, Financial, Market, Team, Governance")
    whyItMatters: str
    suggestedValidation: str


class KeyInsights(BaseModel):
    strengths: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    opportunities: List[str] = Field(default_factory=list)
    nextSteps: List[str] = Field(default_factory=list)


class Agent4RecommendationResult(BaseModel):
    id: str
    analysis_id: str
    startup_name: str
    
    # Investment Verdict
    recommendation: Literal["INVEST", "MONITOR", "MAYBE", "PASS"]
    recommendation_label: str
    confidence: Literal["High", "Moderate", "Low"]
    confidence_score: float = 0.85
    
    # Core Narratives
    investment_thesis: str
    
    # Structured Key Insights
    key_insights: KeyInsights
    
    # Founder Due Diligence Inquiries
    due_diligence_questions: List[DueDiligenceQuestion] = Field(default_factory=list)
    
    # Upstream Lineage
    overall_score: int = Field(..., ge=0, le=100)
    dimension_scores: Dict[str, int] = Field(default_factory=dict)
    
    generation_source: str = "gemini_and_rules"
    created_at: str
    schema_version: str = "1.0"


class Agent4RecommendationRequest(BaseModel):
    analysis_id: str
    startup_name: Optional[str] = None
    scoring_data: Optional[Dict[str, Any]] = None
    normalized_data: Optional[Dict[str, Any]] = None
    save_to_database: bool = True
