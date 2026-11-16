"""Financial & Unit Economics Scorer for Agent 3.

Evaluates:
- Cash runway and burn rate sustainability
- Unit economics (LTV/CAC ratio, Gross Margin %)
- Annual Recurring Revenue (ARR) scale
- Capital efficiency status
"""

from typing import Any, Dict
from models.scoring_models import DimensionScore


def score_financial_dimension(data: Dict[str, Any], weight: float = 0.15) -> DimensionScore:
    fin = data.get("financial_information") or {}

    arr = fin.get("annual_recurring_revenue") or 0.0
    runway = fin.get("runway_months")
    margin = fin.get("gross_margin_percentage")
    ltv_cac = fin.get("ltv_cac_ratio")
    burn = fin.get("monthly_burn_rate") or 0.0
    efficiency = (fin.get("capital_efficiency_status") or "moderate").lower()
    churn = fin.get("churn_rate_percentage")

    positives = []
    risks = []

    # 1. Runway Sustainability (up to 30 pts)
    runway_pts = 18
    if runway is not None:
        if runway >= 18:
            runway_pts = 30
            positives.append(f"Extended runway ({runway:.0f} months) provides ample operational breathing room")
        elif runway >= 12:
            runway_pts = 24
            positives.append(f"Healthy runway ({runway:.0f} months) sufficient for target milestone execution")
        elif runway >= 6:
            runway_pts = 16
            risks.append(f"Tight cash runway ({runway:.0f} months); capital raise timeline critical")
        else:
            runway_pts = 8
            risks.append(f"Distressed runway (< 6 months: {runway:.0f} months); immediate financing needed")
    else:
        runway_pts = 18
        positives.append("Capital structure baseline assumed for early diligence")

    # 2. Unit Economics: LTV/CAC & Gross Margin (up to 30 pts)
    unit_pts = 18
    if ltv_cac is not None:
        if ltv_cac >= 4.0:
            unit_pts = 26
            positives.append(f"World-class unit economics: {ltv_cac:.1f}x LTV/CAC ratio")
        elif ltv_cac >= 3.0:
            unit_pts = 21
            positives.append(f"Sound commercial unit economics: {ltv_cac:.1f}x LTV/CAC ratio")
        elif ltv_cac >= 1.5:
            unit_pts = 16
        else:
            unit_pts = 10
            risks.append(f"Sub-optimal customer acquisition efficiency ({ltv_cac:.1f}x LTV/CAC)")

    if margin is not None:
        if margin >= 75.0:
            unit_pts = min(30, unit_pts + 4)
            positives.append(f"High gross margin software profile ({margin:.0f}%)")
        elif margin < 50.0:
            risks.append(f"Compressed gross margin ({margin:.0f}%) indicates high cost of delivery")

    # 3. Revenue Scale & ARR (up to 25 pts)
    rev_pts = 15
    if arr >= 2_000_000:
        rev_pts = 25
        positives.append(f"Commercial ARR scale: ${arr/1e6:.1f}M recurring revenue")
    elif arr >= 500_000:
        rev_pts = 21
        positives.append(f"Demonstrated product-market fit: ${arr/1e3:.0f}k ARR")
    elif arr > 0:
        rev_pts = 17
        positives.append(f"Early revenue traction recorded (${arr:,.0f} ARR)")
    else:
        rev_pts = 14
        positives.append("Pre-revenue / early development profile")

    # 4. Capital Efficiency & Burn Discipline (up to 15 pts)
    eff_pts = 12
    if efficiency == "healthy":
        eff_pts = 15
        positives.append("Disciplined burn rate aligned with growth trajectory")
    elif efficiency == "critical":
        eff_pts = 6
        risks.append(f"High monthly burn rate (${burn:,.0f}/mo) relative to cash reserves")
    else:
        eff_pts = 11

    if churn is not None and churn > 5.0:
        risks.append(f"Elevated monthly churn rate ({churn:.1f}%) creates recurring revenue headwind")

    raw_score = runway_pts + unit_pts + rev_pts + eff_pts
    final_score = max(25, min(96, raw_score))

    status = (
        "exceptional" if final_score >= 88
        else "strong" if final_score >= 78
        else "moderate" if final_score >= 65
        else "distressed" if final_score < 45
        else "weak"
    )

    arr_str = f"${arr/1e6:.1f}M ARR" if arr >= 1_000_000 else f"${arr/1e3:.0f}k ARR" if arr > 0 else "pre-revenue"
    runway_str = f"{runway:.0f}m runway" if runway is not None else "undisclosed runway"
    rationale = f"Financial assessment based on {arr_str}, {runway_str}, and {efficiency} capital efficiency status."

    return DimensionScore(
        name="Financial",
        score=final_score,
        weight=weight,
        weighted_score=round(final_score * weight, 2),
        status=status,
        rationale=rationale,
        positive_signals=positives,
        risk_factors=risks,
    )
