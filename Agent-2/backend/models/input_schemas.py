from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ==============================================================================
# AGENT 1 INPUT CONTRACT: DOCUMENT INTELLIGENCE
# ==============================================================================

class Agent1FounderInput(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    background: Optional[str] = None


class Agent1FinancialsInput(BaseModel):
    revenue: Optional[str] = None
    arr: Optional[str] = None
    mrr: Optional[str] = None
    burn_rate: Optional[str] = None
    runway: Optional[str] = None
    growth_rate: Optional[str] = None
    gross_margin: Optional[str] = None
    churn: Optional[str] = None
    cac: Optional[str] = None
    ltv: Optional[str] = None


class Agent1MarketSizeInput(BaseModel):
    tam: Optional[str] = None
    sam: Optional[str] = None
    som: Optional[str] = None


class Agent1EvidenceInput(BaseModel):
    claim: str
    source: Optional[str] = None
    location: Optional[str] = None
    supporting_text: Optional[str] = None
    confidence: Optional[float] = None


class Agent1Payload(BaseModel):
    startup_name: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    sector: Optional[str] = None
    founders: List[Agent1FounderInput] = Field(default_factory=list)
    product: Optional[str] = None
    business_model: Optional[str] = None
    target_customers: Optional[str] = None
    financials: Agent1FinancialsInput = Field(default_factory=Agent1FinancialsInput)
    funding_raised: Optional[str] = None
    investors: List[str] = Field(default_factory=list)
    customers: Optional[str] = None
    traction: Optional[str] = None
    market_size: Agent1MarketSizeInput = Field(default_factory=Agent1MarketSizeInput)
    competitors: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    key_metrics: Dict[str, Any] = Field(default_factory=dict)
    missing_information: List[str] = Field(default_factory=list)
    evidence: List[Agent1EvidenceInput] = Field(default_factory=list)
    contradictions: List[Dict[str, Any]] = Field(default_factory=list)
    source_files: List[str] = Field(default_factory=list)


# ==============================================================================
# AGENT 6 INPUT CONTRACT: CODEBASE & REPOSITORY DILIGENCE
# ==============================================================================

class Agent6FindingInput(BaseModel):
    category: str = Field(..., description="project | problem | technology | architecture | feature | technical")
    claim: str
    status: str = Field(default="supported", description="supported | inferred | unknown")
    evidence: List[str] = Field(default_factory=list)


class Agent6RepositoryInput(BaseModel):
    owner: Optional[str] = None
    name: Optional[str] = None
    full_name: Optional[str] = None


class Agent6RawAnalysisInput(BaseModel):
    project_name: Optional[str] = None
    project_type: Optional[str] = None
    problem_solved: Optional[str] = None
    target_users: List[str] = Field(default_factory=list)
    key_features: List[str] = Field(default_factory=list)
    technology_stack: List[str] = Field(default_factory=list)
    business_use_case: Optional[str] = None
    potential_startup_idea: Optional[str] = None
    startup_potential: Optional[str] = None
    technical_strengths: List[str] = Field(default_factory=list)
    technical_concerns: List[str] = Field(default_factory=list)


class Agent6Payload(BaseModel):
    version: Optional[str] = "1.0"
    run_id: Optional[str] = None
    timestamp: Optional[str] = None
    source_agent: Optional[str] = "agent_6_project_code"
    target_agent: Optional[str] = "agent_2_data_normalization"
    github_url: Optional[str] = None
    repository: Agent6RepositoryInput = Field(default_factory=Agent6RepositoryInput)
    findings_summary: Dict[str, Any] = Field(default_factory=dict)
    findings: List[Agent6FindingInput] = Field(default_factory=list)
    raw_analysis: Optional[Agent6RawAnalysisInput] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ==============================================================================
# EXTERNAL RESEARCH INPUT CONTRACT (AGENT-RESEARCH / TASKS 5–9)
# ==============================================================================

class ExternalEvidenceSourceInput(BaseModel):
    url: Optional[str] = None
    title: Optional[str] = None
    snippet: Optional[str] = None
    domain: Optional[str] = None
    published_date: Optional[str] = None
    confidence_score: float = 0.80


class ExternalMarketResearchInput(BaseModel):
    tam: Optional[str] = None
    sam: Optional[str] = None
    som: Optional[str] = None
    cagr: Optional[str] = None
    overall_market_score: Optional[int] = None
    market_drivers: List[str] = Field(default_factory=list)
    market_headwinds: List[str] = Field(default_factory=list)
    icp_definition: Optional[str] = None


class ExternalCompetitorResearchInput(BaseModel):
    competitive_advantage_score: Optional[int] = None
    competitors: List[Dict[str, Any]] = Field(default_factory=list)
    feature_matrix: List[Dict[str, Any]] = Field(default_factory=list)
    moat_analysis: Dict[str, Any] = Field(default_factory=dict)


class ExternalFinancialResearchInput(BaseModel):
    financial_health_score: Optional[int] = None
    funding_history: List[Dict[str, Any]] = Field(default_factory=list)
    estimated_burn_rate: Optional[str] = None
    runway_months: Optional[int] = None
    valuation_benchmarks: Dict[str, Any] = Field(default_factory=dict)
    capital_efficiency: Dict[str, Any] = Field(default_factory=dict)


class ExternalNewsResearchInput(BaseModel):
    news_momentum_score: Optional[int] = None
    sentiment_summary: Optional[str] = None
    recent_events: List[Dict[str, Any]] = Field(default_factory=list)


class ExternalResearchPayload(BaseModel):
    status: Optional[str] = "completed"
    search_provider_used: Optional[str] = "zerocost_search"
    overall_confidence: float = 0.80
    evidence_sources: List[ExternalEvidenceSourceInput] = Field(default_factory=list)
    market_research: Optional[ExternalMarketResearchInput] = None
    competitor_research: Optional[ExternalCompetitorResearchInput] = None
    financial_research: Optional[ExternalFinancialResearchInput] = None
    news_research: Optional[ExternalNewsResearchInput] = None


# ==============================================================================
# AGENT 2 COMPOSITE NORMALIZATION REQUEST
# ==============================================================================

class NormalizationRequest(BaseModel):
    analysis_id: str = Field(..., description="Unique identifier of parent analysis")
    startup_id: Optional[str] = Field(default=None, description="Optional canonical startup identifier")
    startup_name: Optional[str] = Field(default=None, description="Known startup title or project name")
    
    # Input payloads from upstream systems
    agent1_data: Optional[Agent1Payload] = Field(default=None, description="Structured document extraction from Agent 1")
    agent6_data: Optional[Agent6Payload] = Field(default=None, description="Codebase intelligence from Agent 6")
    external_research_data: Optional[ExternalResearchPayload] = Field(default=None, description="External web & market research")

    # Pipeline processing flags
    save_to_database: bool = Field(default=True, description="Persist normalized profile to Supabase")
    enable_llm_disambiguation: bool = Field(default=True, description="Use Gemini LLM for ambiguous semantic mapping")
    reprocess_if_exists: bool = Field(default=True, description="Overwrite previous normalization for this analysis_id")

