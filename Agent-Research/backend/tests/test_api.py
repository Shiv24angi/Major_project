import asyncio
from app.main import home
from app.api.routes import health_check
from schemas.research_schemas import EvidenceSource, EvidenceValidationRequest
from services.evidence_validator import evidence_validator


def test_home_endpoint():
    data = home()
    assert data["service"] == "Nivesh External Research Engine"
    assert data["status"] == "online"
    assert data["port"] == 8002
    assert len(data["tasks_supported"]) == 5


def test_health_endpoint():
    data = health_check()
    assert data["status"] == "healthy"
    assert data["zero_cost_mode"] is True
    assert data["active_search_provider"] == "zerocost_search"


def test_validate_evidence_direct():
    req = EvidenceValidationRequest(
        sources=[
            EvidenceSource(
                url="https://bloomberg.com/news/articles/2026-02-01/ai-funding",
                title="Bloomberg AI Tech",
                snippet="Venture capital funding for generative AI models reached a record high in early 2026.",
                published_date="2026-02-01",
                domain="bloomberg.com",
            )
        ],
        target_claim="Venture capital funding generative AI models",
    )
    # Validate synchronously
    res = evidence_validator.validate_sources_sync(req)
    assert res.sources_count == 1
    assert res.verified_count == 1
    assert res.overall_confidence >= 0.70
    assert res.validated_sources[0].validation_status == "verified"
