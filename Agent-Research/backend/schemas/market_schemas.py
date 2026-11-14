from typing import List, Optional
from pydantic import BaseModel, Field
from schemas.research_schemas import EvidenceSource, ResearchScope


class MarketSizing(BaseModel):
    tam: str = Field(..., description="Total Addressable Market size (e.g., '$45.2 Billion')")
    tam_description: str = Field(..., description="TAM definition, segment coverage, and methodology")
    sam: str = Field(..., description="Serviceable Addressable Market (e.g., '$8.5 Billion')")
    sam_description: str = Field(..., description="SAM definition based on target geography/industry vertical")
    som: str = Field(..., description="Serviceable Obtainable Market (e.g., '$850 Million')")
    som_description: str = Field(..., description="Realistic 3-5 year obtainable market share projection")
    cagr: str = Field(..., description="Compound Annual Growth Rate (e.g., '19.4%')")
    cagr_timeframe: str = Field(default="2024-2030", description="Forecast period for CAGR")
    confidence_score: float = Field(default=0.75, ge=0.0, le=1.0)
    primary_sources: List[str] = Field(default_factory=list, description="Primary research citations backing numbers")


class MarketTrend(BaseModel):
    trend: str = Field(..., description="Market or technology trend name")
    impact: str = Field(default="High", description="'High', 'Medium', or 'Low'")
    direction: str = Field(default="tailwind", description="'tailwind' | 'headwind' | 'neutral'")
    description: str = Field(..., description="How this trend impacts the startup and market evolution")
    evidence: List[str] = Field(default_factory=list, description="Supporting evidence quotes or URLs")


class IndustryDynamics(BaseModel):
    growth_drivers: List[str] = Field(default_factory=list, description="Key catalysts fueling market demand")
    market_headwinds: List[str] = Field(default_factory=list, description="Macro risks, friction points, or slowdown risks")
    barriers_to_entry: List[str] = Field(default_factory=list, description="Defensibility hurdles for new entrants")
    regulatory_landscape: List[str] = Field(default_factory=list, description="Key compliance, legal, or policy constraints")
    target_customer_segments: List[str] = Field(default_factory=list, description="High-priority customer cohorts")
    icp_definition: str = Field(..., description="Ideal Customer Profile specification")


class MarketResearchRequest(BaseModel):
    startup_name: str = Field(..., description="Company or venture project name")
    industry: str = Field(..., description="Industry domain (e.g., 'HealthTech', 'Enterprise AI', 'ClimateTech')")
    project_description: str = Field(..., description="Core product or value proposition description")
    website: Optional[str] = Field(default=None, description="Startup official website if available")
    target_geography: str = Field(default="Global", description="Target region (e.g., 'Global', 'North America', 'India', 'Europe')")
    scope: ResearchScope = ResearchScope.MARKET


class MarketResearchResult(BaseModel):
    startup_name: str
    industry: str
    target_geography: str
    summary: str = Field(..., description="Executive market thesis and investment potential summary")
    market_sizing: MarketSizing
    trends: List[MarketTrend] = Field(default_factory=list)
    industry_dynamics: IndustryDynamics
    citations: List[EvidenceSource] = Field(default_factory=list)
    overall_market_score: int = Field(default=75, ge=0, le=100, description="Overall Market Attractiveness Score (0-100)")
    generated_at: str

