from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class NormalizedMetric(BaseModel):
    metric_name: str
    original_value: Any
    normalized_value: Any
    unit: Optional[str] = None
    currency: Optional[str] = None
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    validation_status: str = Field(default="valid", description="valid | warning | invalid | unverified")
    conflict_status: str = Field(default="none", description="none | resolved | unresolved")
    source_agent: str = Field(..., description="agent1 | agent6 | external_research | synthesized")


class ValidationIssue(BaseModel):
    field: str
    severity: str = Field(..., description="error | warning | info")
    rule: str
    message: str
    original_value: Optional[Any] = None
    action_taken: str = Field(default="flagged", description="flagged | sanitized | rejected | default_assigned")


class DuplicateRecord(BaseModel):
    field: str
    duplicate_value: Any
    kept_value: Any
    source_agents: List[str]
    similarity_score: float = 1.0
    action: str = Field(default="consolidated", description="consolidated | discarded | clustered")


class ConflictRecord(BaseModel):
    field: str
    category: str
    candidates: List[Dict[str, Any]] = Field(default_factory=list, description="List of {source, value, timestamp, confidence}")
    resolved_value: Optional[Any] = None
    resolution_policy: str = Field(..., description="source_authority | recency | confidence_weighted | manual_review_required")
    resolution_rationale: str
    is_resolved: bool = True


class MissingFieldRecord(BaseModel):
    field: str
    category: str
    importance: str = Field(..., description="critical | important | optional")
    description: str
    downstream_impact: str


class SourceProvenanceRecord(BaseModel):
    field_path: str
    source_agent: str
    document_or_url: Optional[str] = None
    location: Optional[str] = None
    evidence_snippet: Optional[str] = None
    confidence_score: float = 0.85
    extraction_timestamp: Optional[str] = None


# Normalized Profile Sub-Objects for Agent 3

class StartupProfile(BaseModel):
    canonical_name: str
    legal_name: Optional[str] = None
    aliases: List[str] = Field(default_factory=list)
    tagline: Optional[str] = None
    description: str
    primary_industry: str
    sub_sectors: List[str] = Field(default_factory=list)
    stage: str
    headquarters: Optional[str] = None
    founded_year: Optional[int] = None
    website: Optional[str] = None
    github_url: Optional[str] = None


class BusinessInformation(BaseModel):
    business_model: str
    monetization_structure: List[str] = Field(default_factory=list)
    target_customer_segments: List[str] = Field(default_factory=list)
    pricing_strategy: Optional[str] = None
    sales_motion: Optional[str] = None
    competitors: List[str] = Field(default_factory=list)
    key_differentiators: List[str] = Field(default_factory=list)
    risk_factors: List[str] = Field(default_factory=list)


class FinancialInformation(BaseModel):
    currency: str = "USD"
    annual_recurring_revenue: Optional[float] = None
    monthly_recurring_revenue: Optional[float] = None
    total_capital_raised: Optional[float] = None
    last_known_valuation: Optional[float] = None
    implied_arr_multiple: Optional[float] = None
    monthly_burn_rate: Optional[float] = None
    runway_months: Optional[float] = None
    gross_margin_percentage: Optional[float] = None
    annual_growth_rate_percentage: Optional[float] = None
    churn_rate_percentage: Optional[float] = None
    cac: Optional[float] = None
    ltv: Optional[float] = None
    ltv_cac_ratio: Optional[float] = None
    capital_efficiency_status: str = Field(default="unverified", description="healthy | moderate | critical | unverified")
    investor_syndicate: List[str] = Field(default_factory=list)
    raw_statements: Dict[str, Any] = Field(default_factory=dict)


class FounderMember(BaseModel):
    name: str
    role: Optional[str] = None
    domain_background: Optional[str] = None
    is_technical: bool = False
    linkedin_url: Optional[str] = None


class TeamInformation(BaseModel):
    founders: List[FounderMember] = Field(default_factory=list)
    team_size_estimate: Optional[int] = None
    technical_founder_present: bool = False
    team_strengths: List[str] = Field(default_factory=list)


class TractionInformation(BaseModel):
    customer_count_estimate: Optional[int] = None
    active_pilot_count: Optional[int] = None
    retention_health: Optional[str] = None
    qualitative_traction: List[str] = Field(default_factory=list)
    public_metrics: Dict[str, Any] = Field(default_factory=dict)


class MarketInformation(BaseModel):
    tam_usd: Optional[float] = None
    sam_usd: Optional[float] = None
    som_usd: Optional[float] = None
    cagr_percentage: Optional[float] = None
    market_drivers: List[str] = Field(default_factory=list)
    market_headwinds: List[str] = Field(default_factory=list)
    icp_profile: Optional[str] = None
    sizing_confidence: float = 0.80


class TechnicalInformation(BaseModel):
    repository_full_name: Optional[str] = None
    tech_stack_standardized: List[str] = Field(default_factory=list)
    architecture_pattern: Optional[str] = None
    code_maturity_rating: str = Field(default="moderate", description="high | moderate | early | unverified")
    supported_feature_claims: List[str] = Field(default_factory=list)
    inferred_feature_claims: List[str] = Field(default_factory=list)
    unsupported_or_unknown_claims: List[str] = Field(default_factory=list)
    technical_strengths: List[str] = Field(default_factory=list)
    technical_risks: List[str] = Field(default_factory=list)
    files_audited_count: int = 0
    agent6_verified: bool = False


class ProjectInformation(BaseModel):
    is_open_source: bool = False
    problem_statement: Optional[str] = None
    primary_solution: Optional[str] = None
    commercialization_readiness: str = Field(default="moderate", description="high | moderate | low")
    enterprise_gaps: List[str] = Field(default_factory=list)


# Unified Master Dataset for Agent 3

class UnifiedStartupEvaluationDataset(BaseModel):
    id: str = Field(..., description="Unique normalization run identifier (e.g. norm_...)")
    analysis_id: str = Field(..., description="Reference to parent public.analyses record")
    startup_id: Optional[str] = None
    normalization_status: str = Field(default="completed", description="completed | partial | failed")
    overall_confidence_score: float = Field(default=0.85, ge=0.0, le=1.0)
    
    # Core Normalized Domain Objects
    startup_profile: StartupProfile
    business_information: BusinessInformation
    financial_information: FinancialInformation
    team_information: TeamInformation
    traction_information: TractionInformation
    market_information: MarketInformation
    technical_information: TechnicalInformation
    project_information: ProjectInformation
    external_research: Dict[str, Any] = Field(default_factory=dict)

    # Auditing, Provenance, & Quality Arrays
    normalized_metrics: List[NormalizedMetric] = Field(default_factory=list)
    validation_results: List[ValidationIssue] = Field(default_factory=list)
    duplicate_records: List[DuplicateRecord] = Field(default_factory=list)
    conflicts: List[ConflictRecord] = Field(default_factory=list)
    missing_fields: List[MissingFieldRecord] = Field(default_factory=list)
    source_provenance: List[SourceProvenanceRecord] = Field(default_factory=list)

    # Execution Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str
    schema_version: str = "1.0"

