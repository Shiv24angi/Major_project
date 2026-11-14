from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from schemas.research_schemas import EvidenceSource, ResearchScope


class CompetitorProfile(BaseModel):
    name: str = Field(..., description="Competitor company or product name")
    website: Optional[str] = Field(default=None, description="Competitor homepage or product URL")
    competitor_type: str = Field(default="direct", description="'direct' | 'indirect' | 'incumbent'")
    description: str = Field(..., description="Overview of the competitor product and offering")
    key_features: List[str] = Field(default_factory=list, description="Core feature set")
    pricing_model: str = Field(default="Enterprise Subscription", description="Pricing structure (e.g. Freemium, Usage-based, Tiered SaaS)")
    estimated_funding_stage: Optional[str] = Field(default="Unknown", description="Funding stage or corporate scale (e.g., 'Series B ($45M)', 'Bootstrapped', 'Public')")
    strengths: List[str] = Field(default_factory=list, description="Core advantages and strengths")
    weaknesses: List[str] = Field(default_factory=list, description="Gaps, pain points, or complaints")
    market_share_estimate: str = Field(default="Emerging Challenger", description="'Leader' | 'Challenger' | 'Niche' | 'Incumbent'")


class FeatureComparisonRow(BaseModel):
    feature_name: str = Field(..., description="Feature or capability being benchmarked")
    category: str = Field(default="Core Capability", description="Category grouping (e.g., 'Automation', 'Integration', 'Security')")
    startup_support: str = Field(default="Yes", description="Level of support ('Yes', 'No', 'Partial', 'Differentiator')")
    competitor_ratings: Dict[str, str] = Field(
        default_factory=dict,
        description="Map of competitor name to support level (e.g. {'CompetitorA': 'Yes', 'CompetitorB': 'No'})"
    )
    startup_advantage_notes: Optional[str] = Field(default=None, description="Why startup's approach is superior or distinct")


class MoatAnalysis(BaseModel):
    overall_defensibility: str = Field(default="Medium", description="'High', 'Medium', or 'Low'")
    moat_types: List[str] = Field(
        default_factory=list,
        description="Identified moats: 'Data Network Effect', 'Proprietary IP', 'Workflow Stickiness', 'High Switching Costs'"
    )
    threat_of_new_entrants: str = Field(default="Medium", description="'High' | 'Medium' | 'Low'")
    threat_of_substitutes: str = Field(default="Medium", description="'High' | 'Medium' | 'Low'")
    bargaining_power_of_buyers: str = Field(default="Medium", description="'High' | 'Medium' | 'Low'")
    key_differentiators: List[str] = Field(default_factory=list, description="Unique value propositions")
    vulnerabilities: List[str] = Field(default_factory=list, description="Key competitor threats or imitation risks")


class CompetitorResearchRequest(BaseModel):
    startup_name: str = Field(..., description="Startup name under evaluation")
    industry: str = Field(..., description="Target industry vertical")
    project_description: str = Field(..., description="Core product functionality and architecture")
    website: Optional[str] = Field(default=None, description="Startup official website")
    known_competitors: List[str] = Field(default_factory=list, description="Any known competitors mentioned in pitch deck")
    target_geography: str = Field(default="Global", description="Target region")
    scope: ResearchScope = ResearchScope.COMPETITORS


class CompetitorResearchResult(BaseModel):
    startup_name: str
    industry: str
    executive_summary: str = Field(..., description="High-level competitive landscape synthesis")
    direct_competitors: List[CompetitorProfile] = Field(default_factory=list)
    indirect_competitors: List[CompetitorProfile] = Field(default_factory=list)
    incumbents: List[CompetitorProfile] = Field(default_factory=list)
    feature_matrix: List[FeatureComparisonRow] = Field(default_factory=list)
    moat_analysis: MoatAnalysis
    citations: List[EvidenceSource] = Field(default_factory=list)
    competitive_advantage_score: int = Field(default=75, ge=0, le=100, description="Defensibility & Competitive Score (0-100)")
    generated_at: str

