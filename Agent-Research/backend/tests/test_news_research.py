import pytest
from datetime import datetime, timezone
from schemas.news_schemas import (
    NewsEvent,
    NewsResearchRequest,
    NewsResearchResult,
    SectorDevelopment,
)
from schemas.research_schemas import EvidenceSource
from services.news_service import news_service


def test_news_query_generation():
    req = NewsResearchRequest(
        startup_name="QuantumShield",
        industry="Post-Quantum Cryptography",
        project_description="Quantum-resilient key exchange for financial networks.",
    )
    queries = news_service.generate_news_queries(req)
    assert len(queries) == 2
    assert "QuantumShield" in queries[0]
    assert "announcements" in queries[0]
    assert "Post-Quantum Cryptography" in queries[1]
    assert "developments" in queries[1]


def test_compute_news_momentum_score():
    positive_events = [
        NewsEvent(
            headline="Series A Funding",
            publisher="TechCrunch",
            event_category="funding",
            sentiment="positive",
            summary="Raised funding",
            key_takeaway="Growth capital",
        ),
        NewsEvent(
            headline="Major Enterprise Product Launch",
            publisher="VentureBeat",
            event_category="product_launch",
            sentiment="positive",
            summary="Launched v2.0",
            key_takeaway="Product expansion",
        ),
        NewsEvent(
            headline="Strategic Channel Partnership",
            publisher="PR Newswire",
            event_category="partnership",
            sentiment="positive",
            summary="Partnered with global cloud provider",
            key_takeaway="Distribution scaling",
        ),
    ]
    strong_devs = [
        SectorDevelopment(
            topic="NIST Quantum Standards Finalized",
            impact="High",
            description="Federal mandate for quantum-proof algorithms.",
            implications_for_startup="Immediate enterprise compliance demand.",
        )
    ]

    high_score = news_service._compute_news_momentum_score(positive_events, strong_devs)
    assert high_score >= 85

    # Negative / concerning event test
    concerning_events = [
        NewsEvent(
            headline="Executive Resignations and Restructuring",
            publisher="Industry Daily",
            event_category="executive_hire",
            sentiment="concerning",
            summary="Key founders departed.",
            key_takeaway="Leadership instability",
        ),
        NewsEvent(
            headline="Regulatory Investigation into Data Practices",
            publisher="Regulatory Monitor",
            event_category="regulatory",
            sentiment="concerning",
            summary="Scrutiny over compliance breaches.",
            key_takeaway="Legal headwind",
        ),
    ]
    low_score = news_service._compute_news_momentum_score(concerning_events, [])
    assert low_score < high_score
    assert low_score <= 55


def test_heuristic_news_result():
    req = NewsResearchRequest(
        startup_name="OmniRetail AI",
        industry="Retail Automation",
        project_description="Automated checkout and inventory tracking.",
    )
    sources = [
        EvidenceSource(
            url="https://venturebeat.com/retail-ai-funding",
            title="VentureBeat Retail AI Article",
            snippet="OmniRetail AI expanded its pilot across major supermarket chains.",
            domain="venturebeat.com",
            confidence_score=0.90,
        )
    ]

    res = news_service._heuristic_news_result(req, sources)
    assert isinstance(res, NewsResearchResult)
    assert res.startup_name == "OmniRetail AI"
    assert res.industry == "Retail Automation"
    assert len(res.timeline) >= 3
    assert len(res.sector_developments) >= 2
    assert res.news_momentum_score >= 65
    assert res.momentum_rating in ("Positive", "Strong Positive")
    assert len(res.citations) == 1
    assert res.timeline[0].event_category == "product_launch"

