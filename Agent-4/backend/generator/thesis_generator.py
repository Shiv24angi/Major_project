"""Investment Thesis Generator for Agent 4.

Synthesizes multi-dimensional findings into an institutional investment thesis.
Supports both Gemini LLM synthesis and calibrated rule-based generation.
"""

import os
from typing import Any, Dict, Optional
import httpx


def generate_rule_based_thesis(
    startup_name: str,
    industry: str,
    overall_score: int,
    recommendation: str,
    scores: Dict[str, int],
    fin: Dict[str, Any],
    tech: Dict[str, Any],
) -> str:
    """Deterministic, calibrated institutional investment thesis generator."""
    arr = fin.get("annual_recurring_revenue") or 0.0
    runway = fin.get("runway_months")
    code_maturity = (tech.get("code_maturity_rating") or "moderate").lower()

    arr_str = f"${arr/1e6:.1f}M ARR" if arr >= 1_000_000 else f"${arr/1e3:.0f}k ARR" if arr > 0 else "seed development"
    runway_str = f"{runway:.0f} months of runway" if runway is not None else "undisclosed runway"

    if recommendation == "INVEST":
        return (
            f"{startup_name} represents a top-quartile investment opportunity within the {industry} sector, "
            f"demonstrating exceptional architectural rigor (Product Score: {scores.get('product', 80)}/100) and sound unit economics. "
            f"With verified commercial traction ({arr_str}, {runway_str}) and verified codebase maturity ('{code_maturity}'), "
            f"the venture possesses defensible competitive barriers. We recommend proceeding with terms at the target valuation."
        )
    elif recommendation == "MONITOR":
        return (
            f"{startup_name} displays promising commercial and technical fundamentals in {industry} (Overall Score: {overall_score}/100), "
            f"evidenced by consistent team execution (Team Score: {scores.get('team', 75)}/100). However, capital deployment velocity and "
            f"customer retention metrics warrant ongoing tracking. We recommend placing the company on active quarterly surveillance."
        )
    elif recommendation == "MAYBE":
        return (
            f"{startup_name} operates in an attractive market niche ({scores.get('market', 70)}/100) with tangible proof-of-concept progress. "
            f"However, key diligence questions regarding unit economics sustainability and unverified feature claims remain open. "
            f"Further milestone validation is mandatory before committing institutional capital."
        )
    else:  # PASS
        return (
            f"Based on calibrated multi-dimensional diligence, {startup_name} does not currently meet institutional risk-adjusted return thresholds "
            f"(Overall Score: {overall_score}/100). Significant execution headwinds, including tight financial runway or structural codebase risks, "
            f"indicate unacceptable early-stage vulnerability. We recommend a definitive pass at this time."
        )


async def generate_investment_thesis(
    startup_name: str,
    industry: str,
    overall_score: int,
    recommendation: str,
    scores: Dict[str, int],
    fin: Dict[str, Any],
    tech: Dict[str, Any],
    gemini_api_key: Optional[str] = None,
) -> str:
    """Generates investment thesis using Gemini LLM if key is available, falling back to rule engine."""
    api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")

    if api_key and not api_key.startswith("your_"):
        prompt = (
            f"You are a Senior Venture Capital Partner writing an institutional investment thesis for a venture committee memo.\n"
            f"Startup: {startup_name}\n"
            f"Industry: {industry}\n"
            f"Overall Score: {overall_score}/100\n"
            f"Recommendation: {recommendation}\n"
            f"Pillar Scores: Market={scores.get('market', 75)}, Product={scores.get('product', 75)}, "
            f"Team={scores.get('team', 75)}, Financial={scores.get('financial', 75)}, Traction={scores.get('traction', 75)}, Risk={scores.get('risk', 75)}.\n"
            f"Write a sharp, 3-sentence investment thesis evaluating product defensibility, market tailwinds, and capital allocation decision."
        )

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.4, "maxOutputTokens": 300},
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidate = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    if len(candidate) > 40:
                        return candidate
        except Exception:
            pass  # Seamless fallback to deterministic thesis

    return generate_rule_based_thesis(startup_name, industry, overall_score, recommendation, scores, fin, tech)
