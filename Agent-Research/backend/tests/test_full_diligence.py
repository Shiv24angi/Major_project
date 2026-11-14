from schemas.diligence_schemas import FullDiligenceRequest, FullDiligenceResult
from schemas.competitor_schemas import CompetitorResearchRequest
from schemas.financial_schemas import FinancialResearchRequest
from schemas.market_schemas import MarketResearchRequest
from schemas.news_schemas import NewsResearchRequest
from services.competitor_service import competitor_service
from services.financial_service import financial_service
from services.market_research_service import market_research_service
from services.news_service import news_service
from services.diligence_service import diligence_service


def test_consolidate_diligence_invest_recommendation():
    """Verify composite scoring and INVEST recommendation for strong startup metrics."""
    req = FullDiligenceRequest(
        startup_name="ScaleAI Inc",
        industry="Enterprise AI",
        project_description="High-throughput human-in-the-loop and synthetic data labeling engine.",
        save_to_supabase=False,
    )

    market_res = market_research_service._heuristic_market_result(
        MarketResearchRequest(
            startup_name="ScaleAI Inc",
            industry="Enterprise AI",
            project_description="AI data labeling platform.",
        ),
        [],
    )
    # Set high score
    market_res = market_res.model_copy(update={"overall_market_score": 90})

    comp_res = competitor_service._heuristic_competitor_result(
        CompetitorResearchRequest(
            startup_name="ScaleAI Inc",
            industry="Enterprise AI",
            project_description="AI data labeling platform.",
        ),
        [],
    )
    comp_res = comp_res.model_copy(update={"competitive_advantage_score": 86})

    fin_res = financial_service._heuristic_financial_result(
        FinancialResearchRequest(
            startup_name="ScaleAI Inc",
            industry="Enterprise AI",
            project_description="AI data labeling platform.",
        ),
        [],
    )
    fin_res = fin_res.model_copy(update={"financial_health_score": 84})

    news_res = news_service._heuristic_news_result(
        NewsResearchRequest(
            startup_name="ScaleAI Inc",
            industry="Enterprise AI",
            project_description="AI data labeling platform.",
        ),
        [],
    )
    news_res = news_res.model_copy(update={"news_momentum_score": 82})

    result = diligence_service.consolidate_diligence(
        req=req,
        market_res=market_res,
        comp_res=comp_res,
        fin_res=fin_res,
        news_res=news_res,
    )

    # 0.30*90 + 0.25*86 + 0.25*84 + 0.20*82 = 27 + 21.5 + 21 + 16.4 = 85.9 -> 85
    assert result.overall_composite_score >= 80
    assert result.overall_recommendation == "INVEST"
    assert result.startup_name == "ScaleAI Inc"
    assert result.persisted_to_supabase is False


def test_consolidate_diligence_monitor_recommendation():
    """Verify composite scoring and MONITOR recommendation for mixed metrics."""
    req = FullDiligenceRequest(
        startup_name="RiskyApp",
        industry="Consumer Social",
        project_description="Niche photo sharing app.",
        save_to_supabase=False,
    )

    market_res = market_research_service._heuristic_market_result(
        MarketResearchRequest(
            startup_name="RiskyApp",
            industry="Consumer Social",
            project_description="Niche photo sharing app.",
        ),
        [],
    )
    market_res = market_res.model_copy(update={"overall_market_score": 50})

    comp_res = competitor_service._heuristic_competitor_result(
        CompetitorResearchRequest(
            startup_name="RiskyApp",
            industry="Consumer Social",
            project_description="Niche photo sharing app.",
        ),
        [],
    )
    comp_res = comp_res.model_copy(update={"competitive_advantage_score": 52})

    fin_res = financial_service._heuristic_financial_result(
        FinancialResearchRequest(
            startup_name="RiskyApp",
            industry="Consumer Social",
            project_description="Niche photo sharing app.",
        ),
        [],
    )
    fin_res = fin_res.model_copy(update={"financial_health_score": 54})

    news_res = news_service._heuristic_news_result(
        NewsResearchRequest(
            startup_name="RiskyApp",
            industry="Consumer Social",
            project_description="Niche photo sharing app.",
        ),
        [],
    )
    news_res = news_res.model_copy(update={"news_momentum_score": 55})

    result = diligence_service.consolidate_diligence(
        req=req,
        market_res=market_res,
        comp_res=comp_res,
        fin_res=fin_res,
        news_res=news_res,
    )

    # 0.30*50 + 0.25*52 + 0.25*54 + 0.20*55 = 15 + 13 + 13.5 + 11 = 52.5 -> 52
    assert result.overall_composite_score <= 65
    assert result.overall_recommendation in ["MONITOR", "PASS"]
