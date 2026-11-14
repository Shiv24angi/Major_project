import asyncio
from datetime import datetime, timezone
import logging
from typing import List, Optional

from crawler.crawler_engine import crawler_engine
from schemas.research_schemas import (
    CrawlResult,
    EvidenceSource,
    EvidenceValidationRequest,
    SearchAndExtractRequest,
    SearchAndExtractResponse,
)
from search.search_provider import hybrid_search
from services.evidence_validator import evidence_validator

logger = logging.getLogger("services.research")


class ResearchService:
    """
    Main orchestration service for external research discovery, crawling,
    and evidence validation.
    """

    async def search_and_extract(self, req: SearchAndExtractRequest) -> SearchAndExtractResponse:
        now_iso = datetime.now(timezone.utc).isoformat()

        # Formulate enriched query
        query_parts = [req.query]
        if req.startup_name:
            query_parts.append(f"startup: {req.startup_name}")
        if req.industry:
            query_parts.append(f"industry: {req.industry}")

        effective_query = " ".join(query_parts)

        # 1. Discovery: Search the web via HybridSearch (Perplexity or zero-cost fallback)
        raw_sources, provider_used = await hybrid_search.search(
            query=effective_query,
            max_results=req.max_sources,
        )

        # If user explicitly supplied a startup website, prepend it as priority seed
        if req.website and req.website.startswith("http"):
            from urllib.parse import urlparse
            site_domain = urlparse(req.website).netloc
            if not any(s.url == req.website for s in raw_sources):
                raw_sources.insert(
                    0,
                    EvidenceSource(
                        url=req.website,
                        title=f"{req.startup_name or 'Startup'} Official Website",
                        snippet=f"Primary landing page and official documentation for {req.startup_name or req.website}",
                        domain=site_domain,
                        domain_credibility_score=0.90,
                        freshness_score=0.90,
                        validation_status="unverified",
                        confidence_score=0.85,
                    ),
                )

        # 2. Evidence Validation: Probe accessibility and score confidence
        if raw_sources:
            validation_resp = await evidence_validator.validate_sources(
                EvidenceValidationRequest(
                    sources=raw_sources,
                    target_claim=req.query,
                ),
                probe_live_urls=True,
            )
            validated_sources = validation_resp.validated_sources
        else:
            validated_sources = []

        # 3. Controlled Crawl: Extract page content for top valid sources
        crawled_pages: List[CrawlResult] = []
        if req.crawl_extracted_urls and validated_sources:
            target_urls = [
                s.url for s in validated_sources
                if s.validation_status in ("verified", "unverified", "low_confidence")
            ][:req.max_sources]

            if target_urls:
                crawled_pages = await crawler_engine.crawl_batch(
                    urls=target_urls,
                    concurrency=3,
                    respect_robots=True,
                )

        return SearchAndExtractResponse(
            query=req.query,
            scope=req.scope.value if req.scope else "general",
            provider_used=provider_used,
            sources=validated_sources,
            crawled_pages=crawled_pages,
            timestamp=now_iso,
        )


# Global singleton instance
research_service = ResearchService()

