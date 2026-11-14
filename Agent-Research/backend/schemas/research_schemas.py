from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ResearchScope(str, Enum):
    GENERAL = "general"
    MARKET = "market"
    COMPETITORS = "competitors"
    FUNDING = "funding"
    NEWS = "news"


# =====================================================================
# CRAWLER SCHEMAS
# =====================================================================

class CrawlRequest(BaseModel):
    urls: List[str] = Field(..., description="List of target URLs to crawl and parse")
    max_depth: int = Field(default=1, ge=1, le=3, description="Crawl depth from seed URLs")
    max_pages: int = Field(default=5, ge=1, le=15, description="Maximum total pages to crawl")
    respect_robots_txt: bool = Field(default=True, description="Strictly respect site robots.txt rules")
    extract_markdown: bool = Field(default=True, description="Format parsed page text into clean LLM Markdown")


class CrawlMetadata(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    published_date: Optional[str] = None
    author: Optional[str] = None
    domain: str = ""
    status_code: int = 200
    content_type: str = "text/html"
    crawled_at: str = ""


class CrawlResult(BaseModel):
    url: str
    status: str = Field(..., description="'success', 'failed', 'blocked_by_robots', 'timeout', 'invalid_content'")
    metadata: CrawlMetadata
    clean_markdown: str = ""
    raw_text: str = ""
    headings: List[str] = Field(default_factory=list)
    links: List[str] = Field(default_factory=list)
    error: Optional[str] = None


class BatchCrawlResponse(BaseModel):
    total_requested: int
    successful_count: int
    failed_count: int
    results: List[CrawlResult]


# =====================================================================
# EVIDENCE & VALIDATION SCHEMAS
# =====================================================================

class EvidenceSource(BaseModel):
    url: str
    title: str = ""
    snippet: str = ""
    published_date: Optional[str] = None
    domain: str = ""
    domain_credibility_score: float = Field(default=0.5, ge=0.0, le=1.0)
    freshness_score: float = Field(default=0.5, ge=0.0, le=1.0)
    validation_status: str = Field(
        default="unverified",
        description="'verified' | 'unverified' | 'unreachable' | 'hallucination' | 'low_confidence'"
    )
    confidence_score: float = Field(default=0.5, ge=0.0, le=1.0)
    validation_notes: Optional[str] = None


class EvidenceValidationRequest(BaseModel):
    sources: List[EvidenceSource]
    target_claim: Optional[str] = Field(
        default=None,
        description="Optional specific statement/claim to cross-verify against source snippets"
    )


class EvidenceValidationResponse(BaseModel):
    overall_confidence: float
    sources_count: int
    verified_count: int
    flagged_count: int
    validated_sources: List[EvidenceSource]


# =====================================================================
# SEARCH & DISCOVERY SCHEMAS
# =====================================================================

class SearchAndExtractRequest(BaseModel):
    query: str = Field(..., description="Search query or research directive")
    startup_name: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    scope: ResearchScope = ResearchScope.GENERAL
    max_sources: int = Field(default=3, ge=1, le=10)
    crawl_extracted_urls: bool = Field(default=True, description="Whether to also crawl & parse discovered URLs")


class SearchAndExtractResponse(BaseModel):
    query: str
    scope: str
    provider_used: str  # 'perplexity' or 'zerocost_search'
    sources: List[EvidenceSource]
    crawled_pages: List[CrawlResult] = Field(default_factory=list)
    timestamp: str

