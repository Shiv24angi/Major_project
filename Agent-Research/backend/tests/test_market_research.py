import pytest
from schemas.market_schemas import (
    IndustryDynamics,
    MarketResearchRequest,
    MarketResearchResult,
    MarketSizing,
    MarketTrend,
)
from schemas.research_schemas import EvidenceSource
from services.market_research_service import market_research_service


def test_query_generation():
    req = MarketResearchRequest(
        startup_name="EcoCharge AI",
        industry="EV Charging Infrastructure",
        project_description="Smart autonomous load balancing for electric vehicle fleet depots.",
        target_geography="North America",
    )
    queries = market_research_service.generate_search_queries(req)
    assert len(queries) == 2
    assert "EV Charging Infrastructure" in queries[0]
    assert "TAM" in queries[0]
    assert "North America" in queries[0]
    assert "trends" in queries[1]


def test_compute_market_score():
    high_growth_sizing = MarketSizing(
        tam="$50 Billion",
        tam_description="Large global market",
        sam="$10 Billion",
        sam_description="Target segment",
        som="$1 Billion",
        som_description="Realistic target",
        cagr="28.5%",
        confidence_score=0.90,
    )
    tailwinds = [
        MarketTrend(trend="Clean Energy Mandate", impact="High", direction="tailwind", description="Policy push"),
        MarketTrend(trend="Fleet Electrification", impact="High", direction="tailwind", description="Commercial shift"),
    ]
    dynamics = IndustryDynamics(
        growth_drivers=["Driver 1", "Driver 2", "Driver 3"],
        market_headwinds=["Grid congestion"],
        barriers_to_entry=["High CAPEX"],
        regulatory_landscape=["EPA Standard"],
        target_customer_segments=["Depot Operators"],
        icp_definition="Commercial fleet operators with >50 EVs",
    )

    high_score = market_research_service._compute_market_score(high_growth_sizing, tailwinds, dynamics)
    assert high_score >= 80

    # Low growth test
    low_growth_sizing = MarketSizing(
        tam="$2 Billion",
        tam_description="Small market",
        sam="$200 Million",
        sam_description="Niche segment",
        som="$15 Million",
        som_description="Modest target",
        cagr="2.1%",
        confidence_score=0.50,
    )
    headwinds = [
        MarketTrend(trend="High Churn", impact="High", direction="headwind", description="Severe churn"),
        MarketTrend(trend="Shrinking Budgets", impact="High", direction="headwind", description="Budget cuts"),
    ]
    low_score = market_research_service._compute_market_score(low_growth_sizing, headwinds, dynamics)
    assert low_score < high_score
    assert low_score <= 60


def test_heuristic_market_result():
    req = MarketResearchRequest(
        startup_name="MediSynth AI",
        industry="Healthcare Generative AI",
        project_description="Synthetic clinical data generation for drug discovery diligence.",
        target_geography="Global",
    )
    sources = [
        EvidenceSource(
            url="https://bloomberg.com/news/healthcare-ai",
            title="Bloomberg Health AI Report",
            snippet="Healthcare AI market is surging with double-digit CAGR.",
            domain="bloomberg.com",
            confidence_score=0.88,
        )
    ]

    res = market_research_service._heuristic_market_result(req, sources)
    assert isinstance(res, MarketResearchResult)
    assert res.startup_name == "MediSynth AI"
    assert res.industry == "Healthcare Generative AI"
    assert "$42.5 Billion" in res.market_sizing.tam
    assert len(res.trends) >= 3
    assert len(res.industry_dynamics.growth_drivers) >= 3
    assert res.overall_market_score >= 60
    assert len(res.citations) == 1
    assert res.citations[0].domain == "bloomberg.com"

