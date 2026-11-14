import pytest
from schemas.financial_schemas import (
    CapitalEfficiencyAnalysis,
    FinancialResearchRequest,
    FinancialResearchResult,
    FundingRound,
    SectorValuationBenchmark,
)
from schemas.research_schemas import EvidenceSource
from services.financial_service import financial_service


def test_financial_query_generation():
    req = FinancialResearchRequest(
        startup_name="BioGenix AI",
        industry="Bioinformatics",
        project_description="Protein folding and drug target validation.",
        claimed_capital_raised="$5.5 Million",
        claimed_arr="$850k",
    )
    queries = financial_service.generate_financial_queries(req)
    assert len(queries) == 3
    assert "BioGenix AI" in queries[0]
    assert "Crunchbase" in queries[0]
    assert "Bioinformatics" in queries[1]
    assert "valuation" in queries[1]
    assert "$5.5 Million" in queries[2] or "revenue" in queries[2]


def test_compute_financial_score():
    efficient_capital = CapitalEfficiencyAnalysis(
        estimated_stage="Seed",
        estimated_monthly_burn="$35k",
        estimated_runway_months="24 months",
        burn_multiple_rating="Efficient",
        unit_economics_outlook="High gross margins with low CAC payback",
        financial_risks=[],
    )
    strong_rounds = [
        FundingRound(
            round_name="Pre-Seed",
            amount_raised="$1.0M",
            lead_investors=["Alpha Fund"],
        ),
        FundingRound(
            round_name="Seed",
            amount_raised="$4.0M",
            lead_investors=["Sequoia Capital"],
        ),
    ]

    high_score = financial_service._compute_financial_score(efficient_capital, strong_rounds)
    assert high_score >= 85

    # Capital intensive & short runway test
    risky_capital = CapitalEfficiencyAnalysis(
        estimated_stage="Seed",
        estimated_monthly_burn="$180k",
        estimated_runway_months="5 months",
        burn_multiple_rating="Capital Intensive",
        unit_economics_outlook="Negative unit margins on compute",
        financial_risks=["Severe runway compression", "Heavy GPU server lease liabilities", "Low pricing power"],
    )
    weak_rounds = [
        FundingRound(
            round_name="Pre-Seed",
            amount_raised="$300k",
            lead_investors=[],
        )
    ]
    low_score = financial_service._compute_financial_score(risky_capital, weak_rounds)
    assert low_score < high_score
    assert low_score <= 55


def test_heuristic_financial_result_stages():
    # Test Seed
    seed_req = FinancialResearchRequest(
        startup_name="NeuroFlow",
        industry="Enterprise B2B SaaS",
        project_description="Agentic meeting summarization and diligence action items.",
        current_stage="Seed",
        claimed_capital_raised="$3.0 Million",
    )
    sources = [
        EvidenceSource(
            url="https://crunchbase.com/organization/neuroflow-ai",
            title="Crunchbase NeuroFlow Profile",
            snippet="NeuroFlow raised a $3M Seed round to expand enterprise sales.",
            domain="crunchbase.com",
            confidence_score=0.95,
        )
    ]

    seed_res = financial_service._heuristic_financial_result(seed_req, sources)
    assert isinstance(seed_res, FinancialResearchResult)
    assert seed_res.startup_name == "NeuroFlow"
    assert seed_res.total_capital_raised == "$3.0 Million"
    assert len(seed_res.funding_rounds) == 1
    assert seed_res.funding_rounds[0].round_name == "Seed"
    assert "16 - 18 months" in seed_res.capital_efficiency.estimated_runway_months
    assert seed_res.financial_health_score >= 70

    # Test Series A
    series_a_req = FinancialResearchRequest(
        startup_name="NeuroFlow",
        industry="Enterprise B2B SaaS",
        project_description="Agentic meeting summarization.",
        current_stage="Series A",
        claimed_capital_raised="$12.0 Million",
    )
    series_a_res = financial_service._heuristic_financial_result(series_a_req, sources)
    assert len(series_a_res.funding_rounds) == 2
    assert series_a_res.funding_rounds[1].round_name == "Series A"
    assert series_a_res.total_capital_raised == "$12.0 Million"

