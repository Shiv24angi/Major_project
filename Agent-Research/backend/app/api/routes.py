from fastapi import APIRouter, HTTPException, Query
from typing import List

from crawler.crawler_engine import crawler_engine
from schemas.research_schemas import (
    BatchCrawlResponse,
    CrawlRequest,
    CrawlResult,
    EvidenceValidationRequest,
    EvidenceValidationResponse,
    SearchAndExtractRequest,
    SearchAndExtractResponse,
)
from schemas.market_schemas import (
    MarketResearchRequest,
    MarketResearchResult,
)
from schemas.competitor_schemas import (
    CompetitorResearchRequest,
    CompetitorResearchResult,
)
from schemas.financial_schemas import (
    FinancialResearchRequest,
    FinancialResearchResult,
)
from schemas.news_schemas import (
    NewsResearchRequest,
    NewsResearchResult,
)
from schemas.diligence_schemas import (
    FullDiligenceRequest,
    FullDiligenceResult,
)
from search.search_provider import hybrid_search
from services.evidence_validator import evidence_validator
from services.research_service import research_service
from services.market_research_service import market_research_service
from services.competitor_service import competitor_service
from services.financial_service import financial_service
from services.news_service import news_service
from services.diligence_service import diligence_service

router = APIRouter()


@router.get("/health", tags=["System"])
def health_check():
    provider = hybrid_search.get_active_provider()
    return {
        "status": "healthy",
        "service": "Nivesh External Research Engine (Agent-Research)",
        "active_search_provider": provider.name,
        "zero_cost_mode": provider.name == "zerocost_search",
        "version": "1.0.0",
    }


@router.post("/crawl", response_model=BatchCrawlResponse, tags=["Web Crawler"])
async def crawl_urls(req: CrawlRequest):
    """
    Asynchronously crawl and parse a batch of target URLs with robots.txt enforcement
    and clean Markdown extraction.
    """
    if not req.urls:
        raise HTTPException(status_code=400, detail="At least one URL must be provided")

    results = await crawler_engine.crawl_batch(
        urls=req.urls[:req.max_pages],
        concurrency=3,
        respect_robots=req.respect_robots_txt,
    )

    success_count = sum(1 for r in results if r.status == "success")
    failed_count = len(results) - success_count

    return BatchCrawlResponse(
        total_requested=len(req.urls),
        successful_count=success_count,
        failed_count=failed_count,
        results=results,
    )


@router.post("/crawl-single", response_model=CrawlResult, tags=["Web Crawler"])
async def crawl_single_url(
    url: str = Query(..., description="Target webpage URL to crawl"),
    respect_robots: bool = Query(True, description="Strictly respect robots.txt"),
):
    """
    Crawl and parse a single page URL.
    """
    return await crawler_engine.crawl_url(url=url, respect_robots=respect_robots)


@router.post("/validate-evidence", response_model=EvidenceValidationResponse, tags=["Evidence Validation"])
async def validate_evidence(req: EvidenceValidationRequest):
    """
    Verify external source citations: check live reachability, domain credibility,
    freshness score, and claim grounding.
    """
    return await evidence_validator.validate_sources(req, probe_live_urls=True)


@router.post("/search-and-extract", response_model=SearchAndExtractResponse, tags=["Research Orchestrator"])
async def search_and_extract(req: SearchAndExtractRequest):
    """
    Complete Task 5 workflow:
    1. Search external web sources (Perplexity or zero-cost engine)
    2. Validate credibility and live status
    3. Crawl pages and extract clean Markdown content for LLM synthesis
    """
    return await research_service.search_and_extract(req)


@router.post("/market", response_model=MarketResearchResult, tags=["Market & Industry Research"])
async def conduct_market_research(req: MarketResearchRequest):
    """
    Task 6: Market and Industry Research
    - Computes TAM, SAM, SOM, CAGR projections
    - Identifies market tailwinds, headwinds, and macro trends
    - Generates defensibility, regulatory dynamics, and ICP definition
    - Evaluates overall Market Attractiveness Score (0-100)
    """
    return await market_research_service.execute_market_research(req)


@router.post("/competitors", response_model=CompetitorResearchResult, tags=["Competitor Intelligence"])
async def conduct_competitor_research(req: CompetitorResearchRequest):
    """
    Task 7: Competitor Research
    - Discovers direct, indirect, and incumbent competitors
    - Compares feature matrix capabilities and differentiators
    - Conducts Porter's five forces & technological moat analysis
    - Generates Competitive Advantage Score (0-100)
    """
    return await competitor_service.execute_competitor_research(req)


@router.post("/financials", response_model=FinancialResearchResult, tags=["Financial & Funding Research"])
async def conduct_financial_research(req: FinancialResearchRequest):
    """
    Task 8: Financial and Funding Research
    - Historical funding rounds, dates, and amounts raised
    - Lead venture capital investors and syndicates
    - Sector ARR multiple and valuation benchmarks
    - Capital efficiency, monthly burn, and runway projection
    - Financial Health Score (0-100)
    """
    return await financial_service.execute_financial_research(req)


@router.post("/news", response_model=NewsResearchResult, tags=["News & Sector Developments"])
async def conduct_news_research(req: NewsResearchRequest):
    """
    Task 9: News and Sector Developments
    - Real-time press coverage, announcements, and product launches
    - Chronological milestone timeline with publication dates
    - Broader sector regulatory & macro developments
    - News Sentiment & Momentum Score (0-100)
    """
    return await news_service.execute_news_research(req)


@router.post("/full-diligence", response_model=FullDiligenceResult, tags=["Master Diligence Orchestrator"])
async def run_full_diligence_pipeline(req: FullDiligenceRequest):
    """
    Unified Master Diligence Pipeline (Tasks 5–9):
    - Concurrently runs Market, Competitors, Financials, and News research modules
    - Computes Consolidated Score (0-100) & Institutional Recommendation (INVEST / MAYBE / MONITOR / PASS)
    - Persists complete structured research results into Supabase (public.research_evaluations)
    """
    return await diligence_service.execute_full_diligence(req)
