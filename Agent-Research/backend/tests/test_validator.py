import pytest
from schemas.research_schemas import EvidenceSource, EvidenceValidationRequest
from services.evidence_validator import evidence_validator


def test_domain_credibility():
    tc_score = evidence_validator.evaluate_domain_credibility("techcrunch.com")
    sec_score = evidence_validator.evaluate_domain_credibility("sec.gov")
    medium_score = evidence_validator.evaluate_domain_credibility("medium.com")
    unknown_score = evidence_validator.evaluate_domain_credibility("random-unknown-blog-xyz.io")

    assert tc_score >= 0.90
    assert sec_score >= 0.90
    assert medium_score >= 0.70
    assert unknown_score <= 0.65


def test_freshness_scoring():
    fresh_2026 = evidence_validator.evaluate_freshness("2026-05-01")
    older_2022 = evidence_validator.evaluate_freshness("Published in 2022")
    ancient_2015 = evidence_validator.evaluate_freshness("2015-01-01")

    assert fresh_2026 >= 0.90
    assert older_2022 < fresh_2026
    assert ancient_2015 <= 0.40


def test_claim_grounding():
    claim = "Company raised a $15 million Series A led by Andreessen Horowitz in 2025."
    grounded_snippet = "The startup successfully raised $15 million Series A funding, with Andreessen Horowitz participating as the lead investor."
    unrelated_snippet = "The weather in San Francisco today was sunny with light winds."

    score_grounded = evidence_validator.evaluate_claim_grounding(grounded_snippet, claim)
    score_unrelated = evidence_validator.evaluate_claim_grounding(unrelated_snippet, claim)

    assert score_grounded > score_unrelated
    assert score_grounded >= 0.60


def test_validate_sources_batch():
    sources = [
        EvidenceSource(
            url="https://techcrunch.com/2026/01/startup-funding",
            title="TechCrunch Article",
            snippet="The AI robotics venture completed their Series A funding round.",
            published_date="2026-01-10",
            domain="techcrunch.com",
        ),
        EvidenceSource(
            url="https://unknown-source-123.com/info",
            title="Random Post",
            snippet="Some unverified claims about the company.",
            published_date="2018-05-01",
            domain="unknown-source-123.com",
        ),
    ]

    req = EvidenceValidationRequest(
        sources=sources,
        target_claim="AI robotics startup Series A funding",
    )

    # Validate synchronously for unit test isolation
    res = evidence_validator.validate_sources_sync(req)

    assert res.sources_count == 2
    assert res.validated_sources[0].domain_credibility_score >= 0.90
    assert res.validated_sources[0].validation_status == "verified"
    assert res.validated_sources[1].domain_credibility_score <= 0.65
