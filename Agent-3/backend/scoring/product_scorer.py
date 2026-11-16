"""Product & Technical Scorer for Agent 3.

Evaluates:
- Agent 6 Code AST maturity rating
- Supported vs inferred feature claims
- Modern tech stack canonicalization
- Commercialization readiness & differentiators
"""

from typing import Any, Dict
from models.scoring_models import DimensionScore


def score_product_dimension(data: Dict[str, Any], weight: float = 0.20) -> DimensionScore:
    tech = data.get("technical_information") or {}
    proj = data.get("project_information") or {}
    biz = data.get("business_information") or {}

    maturity = (tech.get("code_maturity_rating") or "moderate").lower()
    supported = tech.get("supported_feature_claims") or []
    inferred = tech.get("inferred_feature_claims") or []
    stack = tech.get("tech_stack_standardized") or []
    strengths = tech.get("technical_strengths") or []
    tech_risks = tech.get("technical_risks") or []
    readiness = (proj.get("commercialization_readiness") or "moderate").lower()

    positives = []
    risks = []

    # 1. Code AST Maturity Rating (up to 35 pts)
    maturity_pts = 25
    if maturity == "high":
        maturity_pts = 35
        positives.append("Agent 6 verified high codebase structural maturity and modularity")
    elif maturity == "moderate":
        maturity_pts = 25
        positives.append("Standard codebase maturity with verified component structure")
    else:
        maturity_pts = 16
        risks.append("Early-stage codebase with limited verified test or architectural scaffolding")

    # 2. Supported Feature Claims Ratio (up to 25 pts)
    tot_claims = len(supported) + len(inferred)
    claim_pts = 20
    if tot_claims > 0:
        ratio = len(supported) / tot_claims
        if ratio >= 0.75:
            claim_pts = 25
            positives.append(f"{len(supported)} feature claims substantiated by repository AST inspection")
        elif ratio >= 0.50:
            claim_pts = 18
        else:
            claim_pts = 12
            risks.append(f"High ratio of unverified feature claims ({len(inferred)} inferred)")
    else:
        claim_pts = 20

    # 3. Standardized Technology Stack (up to 20 pts)
    stack_pts = 14
    if len(stack) >= 3:
        stack_pts = 20
        positives.append(f"Production-grade tech stack: {', '.join(stack[:4])}")
    elif len(stack) >= 1:
        stack_pts = 16
    else:
        stack_pts = 12

    # 4. Technical Strengths vs Risks & Readiness (up to 20 pts)
    readiness_pts = 14
    if readiness == "high":
        readiness_pts = 18
        positives.append("High commercialization readiness across API and service layers")
    elif readiness == "moderate":
        readiness_pts = 14
    else:
        readiness_pts = 10
        risks.append("Prototype stage requires substantial productization before enterprise pilot")

    if tech_risks:
        risks.extend(tech_risks[:2])

    raw_score = maturity_pts + claim_pts + stack_pts + readiness_pts
    final_score = max(30, min(97, raw_score))

    status = "exceptional" if final_score >= 88 else "strong" if final_score >= 78 else "moderate" if final_score >= 65 else "weak"
    rationale = f"Evaluated product rigor from Agent 6 code AST with '{maturity}' maturity rating, {len(supported)} verified feature claims, and '{readiness}' readiness."

    return DimensionScore(
        name="Product",
        score=final_score,
        weight=weight,
        weighted_score=round(final_score * weight, 2),
        status=status,
        rationale=rationale,
        positive_signals=positives,
        risk_factors=risks,
    )
