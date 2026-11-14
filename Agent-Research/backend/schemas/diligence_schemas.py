from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from schemas.competitor_schemas import CompetitorResearchResult
from schemas.financial_schemas import FinancialResearchResult
from schemas.market_schemas import MarketResearchResult
from schemas.news_schemas import NewsResearchResult
from schemas.research_schemas import EvidenceSource, ResearchScope


class FullDiligenceRequest(BaseModel):
    startup_name: str = Field(..., description="Startup or Project name")
    industry: str = Field(default="Technology", description="Primary industry sector")
    project_description: str = Field(..., description="Product value proposition, problem, and solution")
    website: Optional[str] = Field(default=None, description="Startup official website")
    current_stage: str = Field(default="Seed", description="Stage: Pre-Seed, Seed, Series A, Series B")
    target_geography: str = Field(default="Global", description="Target region")
    known_competitors: List[str] = Field(default_factory=list, description="Any known competitors mentioned in pitch deck")
    claimed_arr: Optional[str] = None
    claimed_capital_raised: Optional[str] = None
    save_to_supabase: bool = Field(default=True, description="Whether to persist results to public.research_evaluations")
    analysis_id: Optional[str] = Field(default=None, description="Foreign key linking to parent public.analyses record")


class FullDiligenceResult(BaseModel):
    id: str
    analysis_id: Optional[str] = None
    startup_name: str
    industry: str
    overall_recommendation: str = Field(default="INVEST", description="'INVEST' | 'MAYBE' | 'MONITOR' | 'PASS'")
    overall_composite_score: int = Field(default=75, ge=0, le=100, description="Consolidated Diligence Score (0-100)")
    market_research: MarketResearchResult
    competitor_research: CompetitorResearchResult
    financial_research: FinancialResearchResult
    news_research: NewsResearchResult
    search_provider_used: str = "zerocost_search"
    evidence_sources_count: int = 0
    crawled_pages_count: int = 0
    persisted_to_supabase: bool = False
    created_at: str

