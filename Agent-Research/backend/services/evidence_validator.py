import asyncio
from datetime import datetime, timezone
import logging
import re
from typing import List, Optional, Set
from urllib.parse import urlparse
import httpx

from schemas.research_schemas import (
    EvidenceSource,
    EvidenceValidationRequest,
    EvidenceValidationResponse,
)

logger = logging.getLogger("services.validator")

# High-authority domains for venture, financial, tech and market intelligence
TIER_1_DOMAINS: Set[str] = {
    "techcrunch.com", "bloomberg.com", "reuters.com", "ft.com", "wsj.com",
    "forbes.com", "cnbc.com", "sec.gov", "crunchbase.com", "pitchbook.com",
    "cbinsights.com", "dealroom.co", "github.com", "ycombinator.com",
    "venturebeat.com", "theinformation.com", "sifted.eu", "statista.com",
    "gartner.com", "mckinsey.com", "bain.com", "bcg.com", "deloitte.com"
}

TIER_2_DOMAINS: Set[str] = {
    "medium.com", "substack.com", "linkedin.com", "producthunt.com",
    "news.ycombinator.com", "wikipedia.org", "businessinsider.com",
    "theverge.com", "wired.com", "techmeme.com", "semrush.com", "similarweb.com"
}


class EvidenceValidator:
    """
    Validates external evidence sources: checks live URL accessibility,
    calculates domain credibility scores, evaluates publication freshness,
    and cross-verifies snippets against target claims.
    """

    def _extract_root_domain(self, url: str) -> str:
        try:
            parsed = urlparse(url)
            netloc = parsed.netloc.lower()
            # Strip port if present
            netloc = netloc.split(":")[0]
            # Strip leading www.
            if netloc.startswith("www."):
                netloc = netloc[4:]
            return netloc
        except Exception:
            return ""

    def evaluate_domain_credibility(self, domain: str) -> float:
        if not domain:
            return 0.3
        domain_lower = domain.lower()
        if any(t1 in domain_lower for t1 in TIER_1_DOMAINS):
            return 0.95
        if any(t2 in domain_lower for t2 in TIER_2_DOMAINS):
            return 0.75
        if domain_lower.endswith(".gov") or domain_lower.endswith(".edu"):
            return 0.95
        if domain_lower.endswith(".org"):
            return 0.80
        # Default reputable commercial domain
        return 0.60

    def evaluate_freshness(self, published_date_str: Optional[str]) -> float:
        if not published_date_str:
            return 0.50

        # Try parsing ISO or common date formats
        current_year = datetime.now(timezone.utc).year
        try:
            # Check year regex first
            match = re.search(r"\b(20[12]\d)\b", published_date_str)
            if match:
                pub_year = int(match.group(1))
                diff = current_year - pub_year
                if diff <= 0:
                    return 1.0   # Current year or future (fresh)
                elif diff == 1:
                    return 0.90  # 1 year old
                elif diff == 2:
                    return 0.75  # 2 years old
                elif diff <= 4:
                    return 0.55  # 3-4 years old
                else:
                    return 0.35  # 5+ years old
        except Exception:
            pass

        return 0.50

    async def verify_url_live(self, url: str, client: httpx.AsyncClient) -> bool:
        """Probe URL to verify it's reachable and not returning 404 or dead link."""
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NiveshValidator/1.0"}
            resp = await client.head(url, headers=headers, timeout=6.0, follow_redirects=True)
            if resp.status_code < 400:
                return True
            if resp.status_code in (403, 405):  # Some servers reject HEAD
                resp = await client.get(url, headers=headers, timeout=6.0, follow_redirects=True)
                return resp.status_code < 400
            return False
        except Exception:
            return False

    def evaluate_claim_grounding(self, snippet: str, claim: str) -> float:
        """Check keyword overlap between snippet and claim statement."""
        if not claim or not snippet:
            return 0.50

        claim_words = set(re.findall(r"\b\w{4,}\b", claim.lower()))
        snippet_words = set(re.findall(r"\b\w{4,}\b", snippet.lower()))

        if not claim_words:
            return 0.50

        overlap = claim_words.intersection(snippet_words)
        ratio = len(overlap) / len(claim_words)
        return min(1.0, max(0.1, ratio * 1.5))

    def validate_source(
        self,
        src: EvidenceSource,
        target_claim: Optional[str] = None,
        is_live: bool = True,
    ) -> EvidenceSource:
        domain = src.domain or self._extract_root_domain(src.url)
        credibility = self.evaluate_domain_credibility(domain)
        freshness = self.evaluate_freshness(src.published_date)

        grounding = 0.5
        if target_claim:
            grounding = self.evaluate_claim_grounding(src.snippet, target_claim)

        if is_live:
            if target_claim:
                confidence = 0.35 * credibility + 0.25 * freshness + 0.40 * grounding
            else:
                confidence = 0.60 * credibility + 0.40 * freshness

            if confidence >= 0.65:
                status = "verified"
                notes = "Source active with verified domain credibility and grounded text."
            else:
                status = "low_confidence"
                notes = "Source active but low authority or dated timestamp."
        else:
            confidence = 0.20
            status = "unreachable"
            notes = "Target URL is unreachable or returned HTTP 4xx/5xx status."

        return src.model_copy(
            update={
                "domain": domain,
                "domain_credibility_score": round(credibility, 2),
                "freshness_score": round(freshness, 2),
                "validation_status": status,
                "confidence_score": round(confidence, 2),
                "validation_notes": notes,
            }
        )

    def validate_sources_sync(
        self,
        request: EvidenceValidationRequest,
    ) -> EvidenceValidationResponse:
        validated_sources: List[EvidenceSource] = []
        verified_count = 0
        flagged_count = 0

        for src in request.sources:
            updated = self.validate_source(src, target_claim=request.target_claim, is_live=True)
            if updated.validation_status == "verified":
                verified_count += 1
            elif updated.validation_status in ("unreachable", "hallucination"):
                flagged_count += 1
            validated_sources.append(updated)

        sources_count = len(validated_sources)
        overall_confidence = (
            round(sum(s.confidence_score for s in validated_sources) / sources_count, 2)
            if sources_count > 0 else 0.0
        )

        return EvidenceValidationResponse(
            overall_confidence=overall_confidence,
            sources_count=sources_count,
            verified_count=verified_count,
            flagged_count=flagged_count,
            validated_sources=validated_sources,
        )

    async def validate_sources(
        self,
        request: EvidenceValidationRequest,
        probe_live_urls: bool = True,
    ) -> EvidenceValidationResponse:
        if not probe_live_urls:
            return self.validate_sources_sync(request)

        validated_sources: List[EvidenceSource] = []
        verified_count = 0
        flagged_count = 0

        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            for src in request.sources:
                is_live = True
                if src.url.startswith("http"):
                    is_live = await self.verify_url_live(src.url, client)

                updated = self.validate_source(src, target_claim=request.target_claim, is_live=is_live)
                if updated.validation_status == "verified":
                    verified_count += 1
                elif updated.validation_status in ("unreachable", "hallucination"):
                    flagged_count += 1
                validated_sources.append(updated)

        sources_count = len(validated_sources)
        overall_confidence = (
            round(sum(s.confidence_score for s in validated_sources) / sources_count, 2)
            if sources_count > 0 else 0.0
        )

        return EvidenceValidationResponse(
            overall_confidence=overall_confidence,
            sources_count=sources_count,
            verified_count=verified_count,
            flagged_count=flagged_count,
            validated_sources=validated_sources,
        )


# Global validator instance
evidence_validator = EvidenceValidator()
