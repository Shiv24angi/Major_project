import asyncio
from datetime import datetime, timezone
import logging
import uuid
from typing import Any, Dict, List, Optional

from schemas.competitor_schemas import CompetitorResearchRequest, CompetitorResearchResult
from schemas.financial_schemas import FinancialResearchRequest, FinancialResearchResult
from schemas.market_schemas import MarketResearchRequest, MarketResearchResult
from schemas.news_schemas import NewsResearchRequest, NewsResearchResult
from schemas.diligence_schemas import (
    FullDiligenceRequest,
    FullDiligenceResult,
)
from schemas.research_schemas import (
    EvidenceSource,
)
from search.search_provider import hybrid_search
from services.competitor_service import competitor_service
from services.financial_service import financial_service
from services.market_research_service import market_research_service
from services.news_service import news_service
from services.supabase_client import supabase_client

logger = logging.getLogger("services.diligence")


class DiligenceService:
    """
    Consolidated Diligence Orchestrator (Tasks 5–9).
    Orchestrates Market, Competitors, Financials, and News research pillars,
    calculates institutional composite score, and persists records to Supabase.
    """

    def consolidate_diligence(
        self,
        req: FullDiligenceRequest,
        market_res: MarketResearchResult,
        comp_res: CompetitorResearchResult,
        fin_res: FinancialResearchResult,
        news_res: NewsResearchResult,
        active_provider: str = "zerocost_search",
        run_id: Optional[str] = None,
        now_iso: Optional[str] = None,
    ) -> FullDiligenceResult:
        """Synchronously consolidate all diligence findings, compute composite score & recommendation."""
        now_iso = now_iso or datetime.now(timezone.utc).isoformat()
        run_id = run_id or f"research_{uuid.uuid4().hex[:12]}"

        # Composite Score Calculation (Tasks 6-9)
        composite_score = int(
            0.30 * market_res.overall_market_score +
            0.25 * comp_res.competitive_advantage_score +
            0.25 * fin_res.financial_health_score +
            0.20 * news_res.news_momentum_score
        )
        composite_score = max(40, min(95, composite_score))

        # Overall Institutional Recommendation
        if composite_score >= 80:
            recommendation = "INVEST"
        elif composite_score >= 70:
            recommendation = "MAYBE"
        elif composite_score >= 55:
            recommendation = "MONITOR"
        else:
            recommendation = "PASS"

        # Unique citations aggregation across all 4 research pillars
        all_citations: List[EvidenceSource] = []
        seen_urls = set()
        for r in [market_res, comp_res, fin_res, news_res]:
            for c in r.citations:
                if c.url not in seen_urls:
                    seen_urls.add(c.url)
                    all_citations.append(c)

        return FullDiligenceResult(
            id=run_id,
            analysis_id=req.analysis_id,
            startup_name=req.startup_name,
            industry=req.industry,
            overall_recommendation=recommendation,
            overall_composite_score=composite_score,
            market_research=market_res,
            competitor_research=comp_res,
            financial_research=fin_res,
            news_research=news_res,
            search_provider_used=active_provider,
            evidence_sources_count=len(all_citations),
            crawled_pages_count=len(seen_urls),
            persisted_to_supabase=False,
            created_at=now_iso,
        )

    async def execute_full_diligence(self, req: FullDiligenceRequest) -> FullDiligenceResult:
        """
        Orchestrate all 4 external research modules concurrently:
        1. Market & Industry (Task 6)
        2. Competitor Benchmarking (Task 7)
        3. Financial History & Runway (Task 8)
        4. News & Sector Events (Task 9)
        Consolidates results and persists directly to Supabase public.research_evaluations.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        run_id = f"research_{uuid.uuid4().hex[:12]}"
        active_provider = hybrid_search.get_active_provider().name

        market_req = MarketResearchRequest(
            startup_name=req.startup_name,
            industry=req.industry,
            project_description=req.project_description,
            website=req.website,
            target_geography=req.target_geography,
        )
        comp_req = CompetitorResearchRequest(
            startup_name=req.startup_name,
            industry=req.industry,
            project_description=req.project_description,
            website=req.website,
            known_competitors=req.known_competitors,
            target_geography=req.target_geography,
        )
        fin_req = FinancialResearchRequest(
            startup_name=req.startup_name,
            industry=req.industry,
            project_description=req.project_description,
            website=req.website,
            current_stage=req.current_stage,
            claimed_arr=req.claimed_arr,
            claimed_capital_raised=req.claimed_capital_raised,
            target_geography=req.target_geography,
        )
        news_req = NewsResearchRequest(
            startup_name=req.startup_name,
            industry=req.industry,
            project_description=req.project_description,
            website=req.website,
            target_geography=req.target_geography,
        )

        tasks = [
            market_research_service.execute_market_research(market_req),
            competitor_service.execute_competitor_research(comp_req),
            financial_service.execute_financial_research(fin_req),
            news_service.execute_news_research(news_req),
        ]

        results = await asyncio.gather(*tasks, return_exceptions=False)

        market_res = results[0]
        comp_res = results[1]
        fin_res = results[2]
        news_res = results[3]

        result = self.consolidate_diligence(
            req=req,
            market_res=market_res,
            comp_res=comp_res,
            fin_res=fin_res,
            news_res=news_res,
            active_provider=active_provider,
            run_id=run_id,
            now_iso=now_iso,
        )

        if req.save_to_supabase:
            supabase_payload = {
                "id": run_id,
                "analysis_id": req.analysis_id,
                "startup_name": req.startup_name,
                "website": req.website,
                "industry": req.industry,
                "status": "completed",
                "search_provider_used": active_provider,
                "overall_confidence": round(
                    sum(c.confidence_score for c in result.market_research.citations) / len(result.market_research.citations), 2
                ) if result.market_research.citations else 0.80,
                "evidence_sources": [c.model_dump() for c in result.market_research.citations],
                "market_research": market_res.model_dump(),
                "competitor_research": comp_res.model_dump(),
                "financial_research": fin_res.model_dump(),
                "news_research": news_res.model_dump(),
                "metadata": {
                    "composite_score": result.overall_composite_score,
                    "recommendation": result.overall_recommendation,
                },
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            persisted = await supabase_client.save_research_evaluation(supabase_payload)
            result = result.model_copy(update={"persisted_to_supabase": persisted})

        return result


# Global singleton instance
diligence_service = DiligenceService()

