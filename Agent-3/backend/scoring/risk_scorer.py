"""Risk & Defensibility Scorer for Agent 3.

Evaluates:
- Cross-agent conflict rate (Agent 1 deck claims vs Agent 6 code AST)
- Data validation integrity & anomaly counts
- Financial distress & runway vulnerability
- Moat defensibility and documented risk factors
- Higher score indicates stronger resilience, mitigation, and defensibility.
"""

from typing import Any, Dict
from models.scoring_models import DimensionScore


def score_risk_dimension(data: Dict[str, Any], weight: float = 0.10) -> DimensionScore:
    conflicts = data.get("conflicts") or []
    validations = data.get("validation_results") or []
    missing = data.get("missing_fields") or []
    biz = data.get("business_information") or {}
    tech = data.get("technical_information") or {}
    fin = data.get("financial_information") or {}

    biz_risks = biz.get("risk_factors") or []
    tech_risks = tech.get("technical_risks") or []
    runway = fin.get("runway_months")
    agent6_verified = tech.get("agent6_verified", False)
    confidence = data.get("overall_confidence_score", 0.85)

    positives = []
    risks = []

    # Baseline resilience score
    resilience_score = 85.0

    # 1. Agent 1 vs Agent 6 Conflict Penalties (up to -24 pts)
    if conflicts:
        conflict_penalty = min(25, len(conflicts) * 8)
        resilience_score -= conflict_penalty
        risks.append(f"{len(conflicts)} cross-source contradiction(s) detected between deck claims and code AST")
    else:
        resilience_score += 4
        positives.append("Zero contradictions detected between pitch claims and code AST")

    # 2. Data Validation & Integrity (up to -15 pts)
    invalid_records = [v for v in validations if v.get("status") in ("invalid", "warning", "rejected")]
    if invalid_records:
        val_penalty = min(15, len(invalid_records) * 3)
        resilience_score -= val_penalty
        risks.append(f"{len(invalid_records)} anomaly flag(s) identified in metric validation")
    else:
        resilience_score += 3
        positives.append("Clean data validation across financial and operational metrics")

    # 3. Runway & Financial Distress
    if runway is not None and runway < 6:
        resilience_score -= 15
        risks.append(f"Imminent financing risk: {runway:.0f} months of operating runway remaining")
    elif runway is not None and runway < 12:
        resilience_score -= 5
        risks.append("Refinancing risk: Less than 12 months cash runway")
    else:
        positives.append("Capital reserves adequately mitigate short-term refinancing risk")

    # 4. Technical & Code AST Defensibility
    if agent6_verified:
        resilience_score += 5
        positives.append("Agent 6 verified code repository architecture confirms technical moat")
    if tech_risks:
        resilience_score -= min(10, len(tech_risks) * 3)
        risks.extend(tech_risks[:2])

    # 5. Missing Critical Fields
    if len(missing) > 3:
        resilience_score -= 6
        risks.append(f"{len(missing)} undisclosed diligence parameters create information opacity")

    # Overall Confidence calibration
    if confidence >= 0.85:
        resilience_score += 3

    final_score = int(max(25, min(95, round(resilience_score))))

    status = (
        "exceptional" if final_score >= 88
        else "strong" if final_score >= 78
        else "moderate" if final_score >= 65
        else "distressed" if final_score < 45
        else "weak"
    )

    rationale = f"Risk resilience calibrated at {final_score}/100 with {len(conflicts)} conflict(s), {len(invalid_records)} validation warning(s), and {len(risks)} identified exposure point(s)."

    return DimensionScore(
        name="Risk",
        score=final_score,
        weight=weight,
        weighted_score=round(final_score * weight, 2),
        status=status,
        rationale=rationale,
        positive_signals=positives,
        risk_factors=risks,
    )
