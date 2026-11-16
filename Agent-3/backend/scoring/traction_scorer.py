"""Traction & Growth Velocity Scorer for Agent 3.

Evaluates:
- Annualized growth rate percentage (YoY / MoM)
- Customer adoption, pilot milestones, enterprise deployments
- Public metrics (GitHub community stars/forks, active users)
- Expansion velocity & pilot-to-contract conversion signals
"""

from typing import Any, Dict
from models.scoring_models import DimensionScore


def score_traction_dimension(data: Dict[str, Any], weight: float = 0.15) -> DimensionScore:
    trac = data.get("traction_information") or {}
    fin = data.get("financial_information") or {}
    proj = data.get("project_information") or {}
    tech = data.get("technical_information") or {}

    growth_rate = fin.get("annual_growth_rate_percentage")
    milestones = trac.get("qualitative_traction") or []
    public_metrics = trac.get("public_metrics") or {}
    is_oss = proj.get("is_open_source", False)
    readiness = (proj.get("commercialization_readiness") or "moderate").lower()

    positives = []
    risks = []

    # 1. Growth Velocity & Expansion Rate (up to 30 pts)
    growth_pts = 16
    if growth_rate is not None:
        if growth_rate >= 100.0:
            growth_pts = 30
            positives.append(f"High-velocity expansion: {growth_rate:.0f}% annual growth trajectory")
        elif growth_rate >= 50.0:
            growth_pts = 24
            positives.append(f"Strong compound growth: {growth_rate:.0f}% annual expansion")
        elif growth_rate >= 20.0:
            growth_pts = 18
            positives.append(f"Steady baseline growth: {growth_rate:.0f}% annual expansion")
        else:
            growth_pts = 12
            risks.append(f"Subdued growth rate ({growth_rate:.0f}%) below venture benchmarks")
    else:
        growth_pts = 18
        positives.append("Early commercial testing stage; growth velocity baseline established")

    # 2. Customer Adoption & Pilot Milestones (up to 30 pts)
    milestone_text = " ".join([str(m) for m in milestones]).lower()
    milestone_pts = 18
    if any(k in milestone_text for k in ["enterprise", "pilot", "paying", "customer", "fortune", "contract", "poc", "client"]):
        milestone_pts = 28
        positives.append(f"Documented enterprise customer adoption ({len(milestones)} milestones recorded)")
    elif len(milestones) > 0:
        milestone_pts = 22
        positives.append(f"{len(milestones)} verified adoption signals in place")
    else:
        milestone_pts = 14
        risks.append("Limited documented enterprise pilot or signed customer verification")

    # 3. Community & Developer Footprint / Public Metrics (up to 25 pts)
    metrics_pts = 15
    stars = public_metrics.get("stars") or public_metrics.get("github_stars") or 0
    forks = public_metrics.get("forks") or 0
    users = public_metrics.get("users") or public_metrics.get("active_users") or 0

    if stars >= 500 or users >= 10000:
        metrics_pts = 25
        positives.append(f"Substantial organic developer pull ({stars} GitHub stars / {users} active users)")
    elif stars >= 50 or users >= 500:
        metrics_pts = 20
        positives.append(f"Emerging community footprint ({stars} stars / active pilot users)")
    elif is_oss or tech.get("files_audited_count", 0) > 10:
        metrics_pts = 18
        positives.append("Active open repository development and code contribution pace")
    else:
        metrics_pts = 14

    # 4. Commercialization Pipeline Maturity (up to 15 pts)
    readiness_pts = 12
    if readiness == "high":
        readiness_pts = 15
        positives.append("Commercialization readiness confirms production sales cycle fit")
    elif readiness == "moderate":
        readiness_pts = 12
    else:
        readiness_pts = 8
        risks.append("Early-stage product maturity may lengthen sales closing cycles")

    raw_score = growth_pts + milestone_pts + metrics_pts + readiness_pts
    final_score = max(25, min(96, raw_score))

    status = (
        "exceptional" if final_score >= 88
        else "strong" if final_score >= 78
        else "moderate" if final_score >= 65
        else "weak"
    )

    growth_str = f"{growth_rate:.0f}% YoY growth" if growth_rate is not None else "early-stage expansion"
    rationale = f"Traction evaluated based on {growth_str}, {len(milestones)} customer milestone(s), and community engagement signals."

    return DimensionScore(
        name="Traction",
        score=final_score,
        weight=weight,
        weighted_score=round(final_score * weight, 2),
        status=status,
        rationale=rationale,
        positive_signals=positives,
        risk_factors=risks,
    )
