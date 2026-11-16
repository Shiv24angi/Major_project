"""Master Analytical Scoring Engine for Agent 3.

Orchestrates multi-dimensional evaluation across the 6 core pillars:
1. Market Score (20%)
2. Product Score (20%)
3. Team Score (20%)
4. Financial Score (15%)
5. Traction Score (15%)
6. Risk Resilience Score (10%)
"""

from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List, Optional

from models.scoring_models import Agent3ScoringResult, DimensionScore
from scoring.financial_scorer import score_financial_dimension
from scoring.market_scorer import score_market_dimension
from scoring.product_scorer import score_product_dimension
from scoring.risk_scorer import score_risk_dimension
from scoring.team_scorer import score_team_dimension
from scoring.traction_scorer import score_traction_dimension


# Weight distributions calibrated to VC diligence standard (sum = 1.0)
WEIGHTS = {
    "market": 0.20,
    "product": 0.20,
    "team": 0.20,
    "financial": 0.15,
    "traction": 0.15,
    "risk": 0.10,
}


def compute_startup_evaluation(
    data: Dict[str, Any],
    analysis_id: str,
    startup_name: Optional[str] = None,
    mode: str = "startup",
) -> Agent3ScoringResult:
    """Executes the full calibrated Agent 3 scoring suite on normalized data."""
    profile = data.get("startup_profile") or {}
    resolved_name = startup_name or profile.get("canonical_name") or data.get("startup_name") or "Startup Evaluation"

    # 1. Run all 6 dimensional evaluations
    market_dim = score_market_dimension(data, weight=WEIGHTS["market"])
    product_dim = score_product_dimension(data, weight=WEIGHTS["product"])
    team_dim = score_team_dimension(data, weight=WEIGHTS["team"])
    financial_dim = score_financial_dimension(data, weight=WEIGHTS["financial"])
    traction_dim = score_traction_dimension(data, weight=WEIGHTS["traction"])
    risk_dim = score_risk_dimension(data, weight=WEIGHTS["risk"])

    # 2. Calculate Composite Weighted Overall Score
    raw_weighted = (
        market_dim.weighted_score
        + product_dim.weighted_score
        + team_dim.weighted_score
        + financial_dim.weighted_score
        + traction_dim.weighted_score
        + risk_dim.weighted_score
    )
    overall_score = max(0, min(100, int(round(raw_weighted))))

    # 3. Determine Investment Recommendation
    if overall_score >= 85:
        recommendation = "INVEST"
        recommendation_label = "Strong High-Conviction Investment Opportunity"
    elif overall_score >= 75:
        recommendation = "MONITOR"
        recommendation_label = "Promising Candidate for Strategic Monitoring"
    elif overall_score >= 65:
        recommendation = "MAYBE"
        recommendation_label = "Conditional Prospect; Requires Milestone Verification"
    else:
        recommendation = "PASS"
        recommendation_label = "Below Target Threshold; High Execution Risk"

    # 4. Assess Analytical Confidence
    input_confidence = float(data.get("overall_confidence_score") or 0.85)
    if input_confidence >= 0.80:
        confidence = "High"
    elif input_confidence >= 0.65:
        confidence = "Moderate"
    else:
        confidence = "Low"

    # 5. Extract Key Positive Drivers and Risk Points
    key_drivers: List[str] = []
    for dim in [team_dim, product_dim, market_dim, financial_dim, traction_dim, risk_dim]:
        if dim.positive_signals:
            key_drivers.extend(dim.positive_signals[:2])
    key_drivers = key_drivers[:5]

    key_risks: List[str] = []
    for dim in [risk_dim, financial_dim, product_dim, market_dim, traction_dim, team_dim]:
        if dim.risk_factors:
            key_risks.extend(dim.risk_factors[:2])
    key_risks = key_risks[:5]

    # 6. Build Narrative Summary
    summary = (
        f"{resolved_name} evaluated with an overall score of {overall_score}/100. "
        f"Key strengths: {team_dim.name} ({team_dim.score}/100) and {product_dim.name} ({product_dim.score}/100). "
        f"Recommendation: {recommendation} with {confidence} confidence."
    )

    eval_id = f"score_{uuid.uuid4().hex[:12]}"
    created_timestamp = datetime.now(timezone.utc).isoformat()

    return Agent3ScoringResult(
        id=eval_id,
        analysis_id=analysis_id,
        startup_name=resolved_name,
        mode=mode if mode in ("startup", "project") else "startup",
        overall_score=overall_score,
        market_score=market_dim.score,
        product_score=product_dim.score,
        team_score=team_dim.score,
        financial_score=financial_dim.score,
        traction_score=traction_dim.score,
        risk_score=risk_dim.score,
        recommendation=recommendation,
        recommendation_label=recommendation_label,
        confidence=confidence,
        confidence_score=round(input_confidence, 2),
        dimensions={
            "market": market_dim,
            "product": product_dim,
            "team": team_dim,
            "financial": financial_dim,
            "traction": traction_dim,
            "risk": risk_dim,
        },
        key_drivers=key_drivers,
        key_risks=key_risks,
        scoring_summary=summary,
        agent2_normalized_id=data.get("id"),
        created_at=created_timestamp,
        schema_version="1.0",
    )
