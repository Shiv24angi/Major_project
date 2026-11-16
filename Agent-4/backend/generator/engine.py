"""Master Recommendation & Insight Engine for Agent 4.

Orchestrates:
1. Investment Thesis Synthesis
2. Key Strengths, Risks, Opportunities, and Next Steps
3. Founder Due Diligence Inquiries
"""

from datetime import datetime, timezone
import uuid
from typing import Any, Dict, Optional

from generator.insights_generator import generate_key_insights
from generator.questions_generator import generate_due_diligence_questions
from generator.thesis_generator import generate_investment_thesis
from models.recommendation_models import Agent4RecommendationResult


async def compute_recommendations_and_insights(
    analysis_id: str,
    startup_name: Optional[str] = None,
    scoring_data: Optional[Dict[str, Any]] = None,
    normalized_data: Optional[Dict[str, Any]] = None,
) -> Agent4RecommendationResult:
    """Produces the complete Agent 4 recommendation and diligence package."""
    scoring = scoring_data or {}
    norm = normalized_data or {}
    profile = norm.get("startup_profile") or {}

    resolved_name = startup_name or profile.get("canonical_name") or scoring.get("startup_name") or "Startup Evaluation"
    industry = profile.get("primary_industry") or "Technology"

    # Extract score lineage from Agent 3
    overall_score = scoring.get("overall_score", 75)
    rec = scoring.get("recommendation", "MONITOR")
    confidence = scoring.get("confidence", "High")
    confidence_score = float(scoring.get("confidence_score", 0.85))

    dimension_scores = {
        "market": scoring.get("market_score", 75),
        "product": scoring.get("product_score", 75),
        "team": scoring.get("team_score", 75),
        "financial": scoring.get("financial_score", 75),
        "traction": scoring.get("traction_score", 75),
        "risk": scoring.get("risk_score", 75),
    }

    # Labels
    if rec == "INVEST":
        rec_label = "Strong High-Conviction Investment Opportunity"
    elif rec == "MONITOR":
        rec_label = "Promising Candidate for Strategic Monitoring"
    elif rec == "MAYBE":
        rec_label = "Conditional Prospect; Requires Milestone Verification"
    else:
        rec_label = "Below Target Threshold; High Execution Risk"

    # 1. Generate Investment Thesis
    thesis = await generate_investment_thesis(
        startup_name=resolved_name,
        industry=industry,
        overall_score=overall_score,
        recommendation=rec,
        scores=dimension_scores,
        fin=norm.get("financial_information") or {},
        tech=norm.get("technical_information") or {},
    )

    # 2. Generate Structured Key Insights
    key_insights = generate_key_insights(
        startup_name=resolved_name,
        scores=dimension_scores,
        normalized_data=norm,
    )

    # 3. Generate Targeted Due Diligence Questions
    questions = generate_due_diligence_questions(
        startup_name=resolved_name,
        scores=dimension_scores,
        normalized_data=norm,
    )

    rec_id = f"rec_{uuid.uuid4().hex[:12]}"
    created_at = datetime.now(timezone.utc).isoformat()

    return Agent4RecommendationResult(
        id=rec_id,
        analysis_id=analysis_id,
        startup_name=resolved_name,
        recommendation=rec,
        recommendation_label=rec_label,
        confidence=confidence,
        confidence_score=confidence_score,
        investment_thesis=thesis,
        key_insights=key_insights,
        due_diligence_questions=questions,
        overall_score=overall_score,
        dimension_scores=dimension_scores,
        generation_source="gemini_and_rules",
        created_at=created_at,
        schema_version="1.0",
    )
