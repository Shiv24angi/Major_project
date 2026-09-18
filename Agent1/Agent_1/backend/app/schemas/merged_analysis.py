from pydantic import BaseModel, Field
from typing import Optional, Any


class SourceReference(BaseModel):
    filename: str
    location: Optional[str] = None


class MergedStartupAnalysis(BaseModel):
    startup_name: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    sector: Optional[str] = None

    founders: list[dict[str, Any]] = Field(
        default_factory=list
    )

    product: Optional[str] = None
    business_model: Optional[str] = None
    target_customers: Optional[str] = None

    financials: dict[str, Any] = Field(
        default_factory=dict
    )

    funding_raised: Optional[str] = None

    investors: list[str] = Field(
        default_factory=list
    )

    customers: Optional[str] = None
    traction: Optional[str] = None

    market_size: dict[str, Any] = Field(
        default_factory=dict
    )

    competitors: list[str] = Field(
        default_factory=list
    )

    risks: list[str] = Field(
        default_factory=list
    )

    key_metrics: dict[str, Any] = Field(
        default_factory=dict
    )

    missing_information: list[str] = Field(
        default_factory=list
    )

    source_files: list[str] = Field(
        default_factory=list
    )