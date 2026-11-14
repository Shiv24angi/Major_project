from typing import List, Optional
from pydantic import BaseModel, Field
from schemas.research_schemas import EvidenceSource, ResearchScope


class FundingRound(BaseModel):
    round_name: str = Field(..., description="Funding round name (e.g. 'Pre-Seed', 'Seed', 'Series A', 'Grant')")
    amount_raised: str = Field(..., description="Amount raised (e.g. '$3.5 Million', 'Undisclosed')")
    date: Optional[str] = Field(default=None, description="Announced date (e.g. '2025-08' or '2024')")
    lead_investors: List[str] = Field(default_factory=list, description="Lead venture funds or syndicates")
    participating_investors: List[str] = Field(default_factory=list, description="Participating angel investors or VCs")
    valuation_post_money: Optional[str] = Field(default=None, description="Post-money valuation if disclosed")
    source_url: Optional[str] = Field(default=None, description="Citation URL for the announcement")


class SectorValuationBenchmark(BaseModel):
    median_arr_multiple: str = Field(default="12x - 18x", description="Industry median ARR revenue multiple")
    target_gross_margin: str = Field(default="70% - 85%", description="Target software/platform gross margins")
    typical_seed_valuation: str = Field(default="$10M - $18M", description="Benchmark Seed post-money valuation")
    typical_series_a_valuation: str = Field(default="$35M - $60M", description="Benchmark Series A post-money valuation")
    benchmark_notes: str = Field(default="Benchmarked against recent venture capital transactions in this vertical.")


class CapitalEfficiencyAnalysis(BaseModel):
    estimated_stage: str = Field(default="Seed Stage", description="Estimated venture development stage")
    estimated_monthly_burn: str = Field(default="$35k - $60k", description="Estimated operating monthly cash burn")
    estimated_runway_months: str = Field(default="14 - 18 months", description="Projected operational runway")
    burn_multiple_rating: str = Field(default="Efficient", description="'Efficient' | 'Moderate' | 'Capital Intensive'")
    unit_economics_outlook: str = Field(..., description="Viability of margins, payback period, and scaling dynamics")
    financial_risks: List[str] = Field(default_factory=list, description="Capital, dilution, or monetization headwinds")


class FinancialResearchRequest(BaseModel):
    startup_name: str = Field(..., description="Startup name under evaluation")
    industry: str = Field(..., description="Industry domain")
    project_description: str = Field(..., description="Product value proposition and business model")
    website: Optional[str] = Field(default=None, description="Startup official website")
    current_stage: str = Field(default="Seed", description="'Pre-Seed' | 'Seed' | 'Series A' | 'Series B'")
    claimed_arr: Optional[str] = Field(default=None, description="Self-reported ARR or revenue from pitch deck if any")
    claimed_capital_raised: Optional[str] = Field(default=None, description="Self-reported total funding if any")
    target_geography: str = Field(default="Global", description="Target region")
    scope: ResearchScope = ResearchScope.FUNDING


class FinancialResearchResult(BaseModel):
    startup_name: str
    industry: str
    executive_financial_summary: str = Field(..., description="Executive assessment of financial feasibility & funding")
    total_capital_raised: str = Field(default="Undisclosed", description="Aggregated total venture capital raised to date")
    latest_known_valuation: str = Field(default="Undisclosed", description="Most recent valuation benchmark")
    funding_rounds: List[FundingRound] = Field(default_factory=list)
    notable_investors: List[str] = Field(default_factory=list)
    sector_benchmarks: SectorValuationBenchmark
    capital_efficiency: CapitalEfficiencyAnalysis
    citations: List[EvidenceSource] = Field(default_factory=list)
    financial_health_score: int = Field(default=75, ge=0, le=100, description="Financial & Funding Viability Score (0-100)")
    generated_at: str

