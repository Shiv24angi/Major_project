import pytest
from schemas.competitor_schemas import (
    CompetitorProfile,
    CompetitorResearchRequest,
    CompetitorResearchResult,
    FeatureComparisonRow,
    MoatAnalysis,
)
from schemas.research_schemas import EvidenceSource
from services.competitor_service import competitor_service


def test_competitor_query_generation():
    req = CompetitorResearchRequest(
        startup_name="CyberGuard AI",
        industry="Autonomous Threat Detection",
        project_description="Agentic endpoint vulnerability remediation.",
        known_competitors=["Darktrace", "CrowdStrike"],
    )
    queries = competitor_service.generate_competitor_queries(req)
    assert len(queries) == 3
    assert "Autonomous Threat Detection" in queries[0]
    assert "CyberGuard AI" in queries[1]
    assert "Darktrace" in queries[2]
    assert "CrowdStrike" in queries[2]


def test_compute_competitive_score():
    high_moat = MoatAnalysis(
        overall_defensibility="High",
        moat_types=["Proprietary Neural AST", "Data Network Effect", "High Switching Costs"],
        threat_of_new_entrants="Low",
        threat_of_substitutes="Low",
        bargaining_power_of_buyers="Medium",
        key_differentiators=["AST code verification"],
        vulnerabilities=["Fast follower imitation"],
    )
    features = [
        FeatureComparisonRow(
            feature_name="AST Code Parsing",
            category="Core AI",
            startup_support="Differentiator",
            competitor_ratings={"CompA": "No"},
        ),
        FeatureComparisonRow(
            feature_name="Real-time Crawling",
            category="Data",
            startup_support="Differentiator",
            competitor_ratings={"CompA": "Partial"},
        ),
    ]

    high_score = competitor_service._compute_competitive_score(high_moat, features)
    assert high_score >= 85

    # Low defensibility test
    low_moat = MoatAnalysis(
        overall_defensibility="Low",
        moat_types=[],
        threat_of_new_entrants="High",
        threat_of_substitutes="High",
        bargaining_power_of_buyers="High",
        key_differentiators=[],
        vulnerabilities=["Commoditized wrapper"],
    )
    low_features = [
        FeatureComparisonRow(
            feature_name="Basic Prompting",
            category="Core",
            startup_support="No",
            competitor_ratings={"CompA": "Yes"},
        )
    ]
    low_score = competitor_service._compute_competitive_score(low_moat, low_features)
    assert low_score < high_score
    assert low_score <= 55


def test_heuristic_competitor_result():
    req = CompetitorResearchRequest(
        startup_name="FinDiligence",
        industry="Fintech VC Analytics",
        project_description="Automating startup financial review and cap-table diligence.",
        known_competitors=["Carta", "PitchBook"],
    )
    sources = [
        EvidenceSource(
            url="https://techcrunch.com/2026/02/fintech-vc-tools",
            title="TechCrunch Fintech Review",
            snippet="New AI entrants are challenging Carta and PitchBook in private market diligence.",
            domain="techcrunch.com",
            confidence_score=0.92,
        )
    ]

    res = competitor_service._heuristic_competitor_result(req, sources)
    assert isinstance(res, CompetitorResearchResult)
    assert res.startup_name == "FinDiligence"
    assert res.industry == "Fintech VC Analytics"
    assert len(res.direct_competitors) >= 2
    assert len(res.indirect_competitors) >= 1
    assert len(res.incumbents) >= 1
    assert len(res.feature_matrix) >= 4
    assert res.moat_analysis.overall_defensibility == "High"
    assert res.competitive_advantage_score >= 70
    assert len(res.citations) == 1

