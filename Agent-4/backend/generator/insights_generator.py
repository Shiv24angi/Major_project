"""Key Insights Generator for Agent 4.

Synthesizes findings from Agent 1 (Pitch Deck), Agent 6 (Code AST),
and Agent 3 (Dimension Scores) into structured strengths, risks, opportunities, and next steps.
"""

from typing import Any, Dict, List
from models.recommendation_models import KeyInsights


def generate_key_insights(
    startup_name: str,
    scores: Dict[str, int],
    normalized_data: Dict[str, Any],
) -> KeyInsights:
    """Produces structured key insights aligned with venture diligence standards."""
    fin = normalized_data.get("financial_information") or {}
    tech = normalized_data.get("technical_information") or {}
    team = normalized_data.get("team_information") or {}
    mkt = normalized_data.get("market_information") or {}
    biz = normalized_data.get("business_information") or {}
    conflicts = normalized_data.get("conflicts") or []

    strengths: List[str] = []
    risks: List[str] = []
    opportunities: List[str] = []
    next_steps: List[str] = []

    # 1. Strengths
    if scores.get("product", 75) >= 80:
        strengths.append(f"Agent 6 Code AST verified high structural maturity and production-grade stack")
    if scores.get("team", 75) >= 80:
        has_tech = team.get("technical_founder_present", True)
        strengths.append(f"Strong founder capability profile with {'in-house technical co-founder leadership' if has_tech else 'seasoned operators'}")
    if scores.get("market", 75) >= 80:
        tam = mkt.get("tam_usd") or 0
        strengths.append(f"Validated market demand in addressable TAM ({f'${tam/1e9:.1f}B' if tam else 'multi-billion'})")
    if fin.get("ltv_cac_ratio") and fin.get("ltv_cac_ratio") >= 3.0:
        strengths.append(f"Sound unit economics with {fin.get('ltv_cac_ratio'):.1f}x LTV/CAC customer acquisition efficiency")
    if len(strengths) < 3:
        strengths.append(f"Documented product-market alignment across core customer workflow")

    # 2. Risks & Concerns
    if conflicts:
        risks.append(f"{len(conflicts)} contradiction(s) identified between pitch deck marketing claims and code AST ground truth")
    runway = fin.get("runway_months")
    if runway is not None and runway < 12:
        risks.append(f"Refinancing vulnerability: Operating runway ({runway:.0f} months) requires capital infusion")
    if len(biz.get("competitors", [])) > 6:
        risks.append(f"Intense competitive clustering with {len(biz.get('competitors'))} established direct alternatives")
    if scores.get("product", 75) < 70:
        risks.append("Early architectural scaffolding requires significant engineering productization before enterprise scale")
    if len(risks) < 2:
        risks.append("Customer acquisition payback and retention cohorts require longitudinal verification")
        risks.append("IP defensibility dependent on continuous proprietary algorithm development")

    # 3. Growth Opportunities
    opportunities.append(f"Enterprise multi-year subscription expansion and automated API monetization")
    if mkt.get("cagr_percentage") and mkt.get("cagr_percentage") >= 15:
        opportunities.append(f"Secular sector tailwind expansion driven by {mkt.get('cagr_percentage'):.1f}% market CAGR")
    opportunities.append("Channel partner integrations and developer ecosystem distribution")
    opportunities.append("Adjacent vertical workflow automation to expand wallet share")

    # 4. Actionable Next Steps
    next_steps.append("Schedule deep-dive technical architecture review with lead engineers")
    next_steps.append("Request audited month-over-month cohort retention and churn data")
    next_steps.append("Execute formal IP assignment and founder equity vesting verification")
    next_steps.append("Conduct blind reference calls with top 3 pilot or paying customers")

    return KeyInsights(
        strengths=strengths[:4],
        risks=risks[:4],
        opportunities=opportunities[:4],
        nextSteps=next_steps[:4],
    )
