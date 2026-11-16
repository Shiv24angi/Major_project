"""Unit Tests for Agent 4: Insight & Recommendation Generator."""

import asyncio
from pathlib import Path
import sys

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from generator.engine import compute_recommendations_and_insights


SAMPLE_SCORING = {
    "analysis_id": "eval_test_instagram",
    "startup_name": "Instagram",
    "overall_score": 88,
    "recommendation": "INVEST",
    "confidence": "High",
    "market_score": 92,
    "product_score": 86,
    "team_score": 90,
    "financial_score": 80,
    "traction_score": 95,
    "risk_score": 85,
}

SAMPLE_NORMALIZED = {
    "startup_profile": {
        "canonical_name": "Instagram",
        "primary_industry": "Social Media / Mobile",
    },
    "financial_information": {
        "annual_recurring_revenue": 10000000.0,
        "runway_months": 24.0,
        "ltv_cac_ratio": 6.2,
    },
    "technical_information": {
        "code_maturity_rating": "high",
        "tech_stack_standardized": ["Python", "Django", "PostgreSQL", "Redis"],
    },
    "team_information": {
        "founders": [
            {"name": "Kevin Systrom", "role": "CEO"},
            {"name": "Mike Krieger", "role": "CTO"},
        ],
        "technical_founder_present": True,
    },
    "market_information": {
        "tam_usd": 50000000000.0,
        "cagr_percentage": 25.0,
    },
    "conflicts": [],
}


def test_agent4_generation():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(
        compute_recommendations_and_insights(
            analysis_id="eval_test_instagram",
            startup_name="Instagram",
            scoring_data=SAMPLE_SCORING,
            normalized_data=SAMPLE_NORMALIZED,
        )
    )

    assert result.recommendation == "INVEST"
    assert result.overall_score == 88
    assert len(result.investment_thesis) > 50
    assert len(result.key_insights.strengths) > 0
    assert len(result.key_insights.risks) > 0
    assert len(result.key_insights.opportunities) > 0
    assert len(result.key_insights.nextSteps) > 0
    assert len(result.due_diligence_questions) >= 4

    for q in result.due_diligence_questions:
        assert q.id
        assert q.question
        assert q.category
        assert q.whyItMatters

    print(f"\n[Agent 4 Test Passed] Generated for {result.startup_name}:")
    print(f"Verdict: {result.recommendation} ({result.overall_score}/100)")
    print(f"Thesis: {result.investment_thesis[:120]}...")
    print(f"Strengths: {len(result.key_insights.strengths)}, Questions: {len(result.due_diligence_questions)}")


if __name__ == "__main__":
    test_agent4_generation()
