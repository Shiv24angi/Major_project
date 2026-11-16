"""Team & Founder Capability Scorer for Agent 3.

Evaluates:
- Technical co-founder presence
- Complementary commercial & technical roles
- Domain background & execution capacity
"""

from typing import Any, Dict
from models.scoring_models import DimensionScore


def score_team_dimension(data: Dict[str, Any], weight: float = 0.20) -> DimensionScore:
    team = data.get("team_information") or {}
    founders = team.get("founders") or []
    has_tech = team.get("technical_founder_present")
    team_size = team.get("team_size_estimate") or len(founders) or 2
    team_strengths = team.get("team_strengths") or []

    positives = []
    risks = []

    # 1. Technical Co-Founder Presence (up to 35 pts)
    tech_pts = 20
    if has_tech:
        tech_pts = 35
        positives.append("Technical co-founder present; in-house product architecture execution")
    else:
        tech_pts = 16
        risks.append("Absence of dedicated technical co-founder creates engineering agency risk")

    # 2. Executive Role Diversity (up to 25 pts)
    role_pts = 18
    roles = [f.get("role", "").lower() for f in founders if isinstance(f, dict)]
    has_ceo = any("ceo" in r or "chief executive" in r or "founder" in r for r in roles)
    has_cto = any("cto" in r or "tech" in r or "engineer" in r for r in roles)

    if has_ceo and has_cto:
        role_pts = 25
        positives.append("Balanced leadership pairing across commercial strategy and technical delivery")
    elif len(founders) >= 2:
        role_pts = 20
        positives.append("Multi-founder governance structure")
    elif len(founders) == 1:
        role_pts = 14
        risks.append("Solo founder operational dependency")

    # 3. Domain Background & Experience (up to 25 pts)
    exp_pts = 18
    backgrounds = " ".join([str(f.get("domain_background") or f.get("background") or "") for f in founders]).lower()
    if any(k in backgrounds for k in ["phd", "google", "meta", "microsoft", "amazon", "apple", "stripe", "ex-"]):
        exp_pts = 25
        positives.append("Founders demonstrate top-tier institutional engineering/operating background")
    elif len(team_strengths) > 0:
        exp_pts = 22
        positives.append(f"Noted team strengths: {', '.join(team_strengths[:2])}")
    else:
        exp_pts = 18

    # 4. Team Bandwidth & Sizing (up to 15 pts)
    size_pts = 12
    if 2 <= team_size <= 15:
        size_pts = 15
        positives.append(f"Agile early-stage execution bandwidth ({team_size} members)")
    else:
        size_pts = 11

    raw_score = tech_pts + role_pts + exp_pts + size_pts
    final_score = max(35, min(98, raw_score))

    status = "exceptional" if final_score >= 88 else "strong" if final_score >= 78 else "moderate" if final_score >= 65 else "weak"
    rationale = f"Evaluated {len(founders)} founder record(s) with technical_founder={has_tech} and estimated team size of {team_size}."

    return DimensionScore(
        name="Team",
        score=final_score,
        weight=weight,
        weighted_score=round(final_score * weight, 2),
        status=status,
        rationale=rationale,
        positive_signals=positives,
        risk_factors=risks,
    )
