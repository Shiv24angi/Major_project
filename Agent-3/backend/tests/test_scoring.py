"""Unit Tests for Agent 3: Analytical Startup Scoring Engine."""

import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from scoring.engine import compute_startup_evaluation


SAMPLE_NORMALIZED_DATASET = {
    "id": "norm_test_123",
    "analysis_id": "eval_test_airbnb",
    "startup_profile": {
        "canonical_name": "Airbnb",
        "description": "Next-generation travel and peer-to-peer accommodation marketplace.",
        "primary_industry": "Consumer / Marketplaces",
        "stage": "Growth",
        "website": "https://airbnb.com",
        "github_url": "https://github.com/airbnb/core",
    },
    "business_information": {
        "business_model": "Two-sided Marketplace / Commission fee",
        "competitors": ["Vrbo", "Booking.com", "Expedia"],
        "risk_factors": ["Municipal regulations", "Platform trust & safety"],
    },
    "financial_information": {
        "annual_recurring_revenue": 5000000.0,
        "monthly_recurring_revenue": 420000.0,
        "total_capital_raised": 10000000.0,
        "monthly_burn_rate": 150000.0,
        "runway_months": 24.0,
        "gross_margin_percentage": 82.0,
        "annual_growth_rate_percentage": 110.0,
        "churn_rate_percentage": 1.2,
        "ltv_cac_ratio": 5.4,
        "capital_efficiency_status": "healthy",
    },
    "team_information": {
        "founders": [
            {"name": "Brian Chesky", "role": "CEO", "domain_background": "Ex-Design Leader", "is_technical": False},
            {"name": "Nathan Blecharczyk", "role": "CTO", "domain_background": "Ex-Harvard Computer Science", "is_technical": True},
        ],
        "team_size_estimate": 10,
        "technical_founder_present": True,
        "team_strengths": ["Strong Founder-Led Execution", "Technical Architecture"],
    },
    "traction_information": {
        "qualitative_traction": [
            "Over 100,000 bookings processed in initial launch",
            "Signed major enterprise partnership agreements",
        ],
        "public_metrics": {"stars": 1200, "active_users": 50000},
    },
    "market_information": {
        "tam_usd": 30000000000.0,
        "sam_usd": 8000000000.0,
        "som_usd": 2000000000.0,
        "cagr_percentage": 18.5,
        "market_drivers": ["Alternative travel experiences", "Remote work flexibility"],
        "market_headwinds": ["City zone regulations"],
    },
    "technical_information": {
        "repository_full_name": "airbnb/core",
        "tech_stack_standardized": ["React", "TypeScript", "Node.js", "PostgreSQL"],
        "code_maturity_rating": "high",
        "supported_feature_claims": ["Dynamic listing search", "Stripe payment integration", "Host calendar sync"],
        "inferred_feature_claims": [],
        "agent6_verified": True,
    },
    "project_information": {
        "is_open_source": False,
        "problem_statement": "Travel accommodation is expensive and impersonal",
        "primary_solution": "Peer-to-peer room booking",
        "commercialization_readiness": "high",
    },
    "conflicts": [],
    "validation_results": [],
    "overall_confidence_score": 0.90,
}


def test_compute_evaluation_structure():
    result = compute_startup_evaluation(
        data=SAMPLE_NORMALIZED_DATASET,
        analysis_id="eval_test_airbnb",
        startup_name="Airbnb",
        mode="startup",
    )

    # 1. Assertions on dimensions
    assert 0 <= result.overall_score <= 100
    assert 0 <= result.market_score <= 100
    assert 0 <= result.product_score <= 100
    assert 0 <= result.team_score <= 100
    assert 0 <= result.financial_score <= 100
    assert 0 <= result.traction_score <= 100
    assert 0 <= result.risk_score <= 100

    # 2. Assertions on recommendation
    assert result.recommendation in ["INVEST", "MONITOR", "MAYBE", "PASS"]
    assert result.confidence in ["High", "Moderate", "Low"]

    # 3. High quality startup assertions
    assert result.overall_score >= 75
    assert len(result.key_drivers) > 0
    assert result.dimensions["team"].status in ["exceptional", "strong"]
    assert result.dimensions["product"].status in ["exceptional", "strong"]

    print(f"\n[Test Passed] Evaluated {result.startup_name}: Overall Score = {result.overall_score}, Recommendation = {result.recommendation}")
    print(f"Dimension Scores: Market={result.market_score}, Product={result.product_score}, Team={result.team_score}, Financial={result.financial_score}, Traction={result.traction_score}, Risk={result.risk_score}")


def test_distressed_startup_scoring():
    distressed_dataset = {
        "id": "norm_distressed",
        "analysis_id": "eval_distressed",
        "startup_profile": {"canonical_name": "Distressed Startup"},
        "financial_information": {
            "annual_recurring_revenue": 0.0,
            "runway_months": 2.0,
            "capital_efficiency_status": "critical",
        },
        "team_information": {
            "founders": [{"name": "Solo Dev", "role": "Founder"}],
            "technical_founder_present": False,
        },
        "market_information": {"tam_usd": 50000000.0, "cagr_percentage": 2.0},
        "technical_information": {
            "code_maturity_rating": "low",
            "supported_feature_claims": [],
            "inferred_feature_claims": ["Claim 1", "Claim 2"],
            "agent6_verified": False,
        },
        "conflicts": [{"field": "mrr", "description": "Deck claims $50k MRR but code has zero payment integration"}],
        "overall_confidence_score": 0.60,
    }

    result = compute_startup_evaluation(
        data=distressed_dataset,
        analysis_id="eval_distressed",
        startup_name="Distressed Startup",
    )

    assert result.overall_score < 65
    assert result.recommendation == "PASS"
    assert len(result.key_risks) > 0
    print(f"\n[Test Passed] Distressed evaluation properly rejected with score {result.overall_score} and recommendation {result.recommendation}")


if __name__ == "__main__":
    test_compute_evaluation_structure()
    test_distressed_startup_scoring()
