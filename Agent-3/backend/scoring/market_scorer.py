"""Market Opportunity Scorer for Agent 3.

Evaluates:
- TAM / SAM / SOM magnitude
- CAGR growth rate
- Market drivers vs headwinds
- Competitor crowding
"""

from typing import Any, Dict
from models.scoring_models import DimensionScore


def score_market_dimension(data: Dict[str, Any], weight: float = 0.20) -> DimensionScore:
    mkt = data.get("market_information") or {}
    biz = data.get("business_information") or {}

    tam = mkt.get("tam_usd") or 0.0
    sam = mkt.get("sam_usd") or 0.0
    som = mkt.get("som_usd") or 0.0
    cagr = mkt.get("cagr_percentage") or 0.0
    drivers = mkt.get("market_drivers") or []
    headwinds = mkt.get("market_headwinds") or []
    competitors = biz.get("competitors") or []

    positives = []
    risks = []

    # 1. TAM Magnitude (up to 30 pts)
    tam_pts = 10
    if tam >= 10_000_000_000:
        tam_pts = 30
        positives.append(f"Substantial mega-market TAM: ${tam/1e9:.1f}B")
    elif tam >= 3_000_000_000:
        tam_pts = 25
        positives.append(f"Healthy enterprise TAM: ${tam/1e9:.1f}B")
    elif tam >= 1_000_000_000:
        tam_pts = 20
        positives.append(f"Viable target market: ${tam/1e9:.1f}B")
    elif tam >= 250_000_000:
        tam_pts = 15
    else:
        tam_pts = 10
        risks.append("Niche or restricted addressable market (< $250M)")

    # 2. CAGR Growth Rate (up to 25 pts)
    cagr_pts = 10
    if cagr >= 20.0:
        cagr_pts = 25
        positives.append(f"Rapid secular sector tailwinds: {cagr:.1f}% CAGR")
    elif cagr >= 12.0:
        cagr_pts = 20
        positives.append(f"Steady market expansion: {cagr:.1f}% CAGR")
    elif cagr >= 6.0:
        cagr_pts = 15
    else:
        cagr_pts = 10
        risks.append(f"Low market growth rate: {cagr:.1f}% CAGR")

    # 3. Market Drivers vs Headwinds (up to 25 pts)
    driver_pts = 15
    net_drivers = len(drivers) - len(headwinds)
    if net_drivers >= 2:
        driver_pts = 25
        positives.append(f"Strong structural macro drivers: {len(drivers)} identified")
    elif net_drivers >= 0:
        driver_pts = 20
    else:
        driver_pts = 12
        risks.append(f"Market headwinds outnumber drivers ({len(headwinds)} headwinds)")

    # 4. Competitor Landscape (up to 20 pts)
    comp_pts = 18
    if len(competitors) > 8:
        comp_pts = 12
        risks.append(f"Crowded market space with {len(competitors)} direct competitors")
    elif len(competitors) >= 1:
        comp_pts = 18
        positives.append(f"Validated market with {len(competitors)} clear alternatives")
    else:
        comp_pts = 15

    raw_score = tam_pts + cagr_pts + driver_pts + comp_pts
    final_score = max(25, min(96, raw_score))

    status = "exceptional" if final_score >= 88 else "strong" if final_score >= 78 else "moderate" if final_score >= 65 else "weak"
    rationale = f"Evaluated addressable market at ${tam/1e9:.1f}B TAM growing at {cagr:.1f}% CAGR with {len(competitors)} categorized competitor clusters."

    return DimensionScore(
        name="Market",
        score=final_score,
        weight=weight,
        weighted_score=round(final_score * weight, 2),
        status=status,
        rationale=rationale,
        positive_signals=positives,
        risk_factors=risks,
    )
