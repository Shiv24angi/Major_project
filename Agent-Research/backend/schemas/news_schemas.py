from typing import List, Optional
from pydantic import BaseModel, Field
from schemas.research_schemas import EvidenceSource, ResearchScope


class NewsEvent(BaseModel):
    headline: str = Field(..., description="Article headline or announcement title")
    published_date: Optional[str] = Field(default=None, description="Publication timestamp or date (e.g. '2026-02-14')")
    publisher: str = Field(..., description="Media outlet, news wire, or domain name")
    url: Optional[str] = Field(default=None, description="Direct URL citation for the article")
    event_category: str = Field(
        default="market_shift",
        description="'product_launch' | 'funding' | 'partnership' | 'executive_hire' | 'regulatory' | 'market_shift'"
    )
    sentiment: str = Field(default="positive", description="'positive' | 'neutral' | 'concerning'")
    summary: str = Field(..., description="Key facts reported in the announcement")
    key_takeaway: str = Field(..., description="Direct strategic impact on the company or vertical")


class SectorDevelopment(BaseModel):
    topic: str = Field(..., description="Industry-wide development, policy, or macro shift")
    impact: str = Field(default="High", description="'High' | 'Medium' | 'Low'")
    description: str = Field(..., description="Details regarding the industry shift")
    implications_for_startup: str = Field(..., description="Opportunity or strategic risk for this startup")


class NewsResearchRequest(BaseModel):
    startup_name: str = Field(..., description="Startup name under evaluation")
    industry: str = Field(..., description="Industry sector")
    project_description: str = Field(..., description="Core product functionality and architecture")
    website: Optional[str] = Field(default=None, description="Startup official website")
    target_geography: str = Field(default="Global", description="Target region")
    time_window_months: int = Field(default=12, ge=1, le=36, description="Lookback window in months")
    scope: ResearchScope = ResearchScope.NEWS


class NewsResearchResult(BaseModel):
    startup_name: str
    industry: str
    executive_news_summary: str = Field(..., description="Synthesized press coverage and sector momentum overview")
    timeline: List[NewsEvent] = Field(default_factory=list, description="Chronological timeline of verified news events")
    sector_developments: List[SectorDevelopment] = Field(default_factory=list, description="Broader ecosystem shifts")
    momentum_rating: str = Field(default="Positive", description="'Strong Positive' | 'Positive' | 'Neutral' | 'Headwind'")
    citations: List[EvidenceSource] = Field(default_factory=list)
    news_momentum_score: int = Field(default=75, ge=0, le=100, description="News Sentiment & Momentum Score (0-100)")
    generated_at: str

