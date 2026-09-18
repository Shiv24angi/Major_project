from pydantic import BaseModel, Field
from typing import Optional


class Founder(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    background: Optional[str] = None


class FinancialMetrics(BaseModel):
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


class MarketSize(BaseModel):
    tam: Optional[str] = None
    sam: Optional[str] = None
    som: Optional[str] = None


class Evidence(BaseModel):
    claim: str

    source: Optional[str] = None

    location: Optional[str] = None

    supporting_text: Optional[str] = None

    confidence: Optional[float] = None


class StartupAnalysis(BaseModel):

    # -----------------------------
    # Document classification
    # -----------------------------

    is_startup_document: bool = False

    document_category: Optional[str] = None

    startup_relevance_reason: Optional[str] = None

    # -----------------------------
    # Startup basic information
    # -----------------------------

    startup_name: Optional[str] = None

    description: Optional[str] = None

    industry: Optional[str] = None

    sector: Optional[str] = None

    # -----------------------------
    # Founders
    # -----------------------------

    founders: list[Founder] = Field(
        default_factory=list
    )

    # -----------------------------
    # Product and business model
    # -----------------------------

    product: Optional[str] = None

    business_model: Optional[str] = None

    target_customers: Optional[str] = None

    # -----------------------------
    # Financial metrics
    # -----------------------------

    financials: FinancialMetrics = Field(
        default_factory=FinancialMetrics
    )

    # -----------------------------
    # Funding
    # -----------------------------

    funding_raised: Optional[str] = None

    investors: list[str] = Field(
        default_factory=list
    )

    # -----------------------------
    # Customers / traction
    # -----------------------------

    customers: Optional[str] = None

    traction: Optional[str] = None

    # -----------------------------
    # Market
    # -----------------------------

    market_size: MarketSize = Field(
        default_factory=MarketSize
    )

    # -----------------------------
    # Competition
    # -----------------------------

    competitors: list[str] = Field(
        default_factory=list
    )

    # -----------------------------
    # Risk
    # -----------------------------

    risks: list[str] = Field(
        default_factory=list
    )

    # -----------------------------
    # Other metrics
    # -----------------------------

    key_metrics: dict[str, str] = Field(
        default_factory=dict
    )

    # -----------------------------
    # Missing information
    # -----------------------------

    missing_information: list[str] = Field(
        default_factory=list
    )

    # -----------------------------
    # Evidence
    # -----------------------------

    evidence: list[Evidence] = Field(
        default_factory=list
    )