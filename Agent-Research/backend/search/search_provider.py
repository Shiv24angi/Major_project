from abc import ABC, abstractmethod
import logging
import os
import re
from typing import List, Optional
from urllib.parse import quote_plus, unquote
import httpx

from schemas.research_schemas import EvidenceSource

logger = logging.getLogger("search.provider")


class BaseSearchProvider(ABC):
    @abstractmethod
    async def search(self, query: str, max_results: int = 5) -> List[EvidenceSource]:
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass


class ZeroCostSearchProvider(BaseSearchProvider):
    """
    Zero-cost search provider using open web search endpoints.
    Requires no paid API keys, tokens, or subscription credit.
    """

    @property
    def name(self) -> str:
        return "zerocost_search"

    async def search(self, query: str, max_results: int = 5) -> List[EvidenceSource]:
        encoded_query = quote_plus(query)
        # Use DuckDuckGo HTML Lite search endpoint
        url = f"https://html.duckduckgo.com/html/?q={encoded_query}"

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        sources: List[EvidenceSource] = []

        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.post(
                    "https://html.duckduckgo.com/html/",
                    data={"q": query, "b": ""},
                    headers=headers
                )
                if resp.status_code != 200:
                    resp = await client.get(url, headers=headers)

                if resp.status_code == 200:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(resp.text, "html.parser")

                    # Extract result links and snippets
                    results = soup.find_all("div", class_=re.compile(r"result\s+results_links"))
                    if not results:
                        results = soup.find_all("div", class_="result")

                    for item in results[:max_results]:
                        link_elem = item.find("a", class_="result__url") or item.find("a", class_="result__snippet") or item.find("a", class_="result__a")
                        snippet_elem = item.find("a", class_="result__snippet") or item.find("div", class_="result__snippet")
                        title_elem = item.find("a", class_="result__a")

                        raw_url = link_elem.get("href", "") if link_elem else ""
                        title = title_elem.get_text(strip=True) if title_elem else ""
                        snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""

                        # Decode DDG redirect url: /l/?uddg=https%3A%2F%2F...
                        target_url = raw_url
                        if "uddg=" in raw_url:
                            match = re.search(r"uddg=([^&]+)", raw_url)
                            if match:
                                target_url = unquote(match.group(1))

                        if target_url.startswith("http") and target_url not in [s.url for s in sources]:
                            from urllib.parse import urlparse
                            domain = urlparse(target_url).netloc
                            sources.append(
                                EvidenceSource(
                                    url=target_url,
                                    title=title or domain,
                                    snippet=snippet,
                                    domain=domain,
                                    domain_credibility_score=0.7,
                                    freshness_score=0.6,
                                    validation_status="unverified",
                                    confidence_score=0.65,
                                )
                            )

        except Exception as e:
            logger.warning(f"Zero-cost search error: {e}")

        return sources


class PerplexitySearchProvider(BaseSearchProvider):
    """
    Perplexity AI Search & Citations Provider.
    Activated whenever PERPLEXITY_API_KEY is configured.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_url = "https://api.perplexity.ai/chat/completions"

    @property
    def name(self) -> str:
        return "perplexity"

    async def search(self, query: str, max_results: int = 5) -> List[EvidenceSource]:
        sources: List[EvidenceSource] = []

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        # Prompt Perplexity Sonar model to search and cite external sources
        payload = {
            "model": "sonar",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an expert financial and venture capital research intelligence agent. "
                        "Perform an exhaustive web search for the given query. Provide comprehensive fact-based findings "
                        "with exact URL citations and dates."
                    ),
                },
                {"role": "user", "content": query},
            ],
            "temperature": 0.1,
            "max_tokens": 1024,
            "return_citations": True,
            "return_related_questions": False,
        }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(self.api_url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    citations = data.get("citations", [])
                    choices = data.get("choices", [])
                    content = choices[0]["message"]["content"] if choices else ""

                    for idx, url in enumerate(citations[:max_results]):
                        from urllib.parse import urlparse
                        domain = urlparse(url).netloc
                        # Snippet excerpt from content
                        snippet = content[:300] if idx == 0 else f"Cited in Perplexity intelligence synthesis: {url}"
                        sources.append(
                            EvidenceSource(
                                url=url,
                                title=f"Source {idx + 1} ({domain})",
                                snippet=snippet,
                                domain=domain,
                                domain_credibility_score=0.85,
                                freshness_score=0.85,
                                validation_status="verified",
                                confidence_score=0.85,
                                validation_notes="Extracted directly via Perplexity live citations",
                            )
                        )
                else:
                    logger.warning(f"Perplexity API returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Perplexity API search request failed: {e}")

        return sources


class HybridSearchService:
    """
    Intelligent router: automatically checks for PERPLEXITY_API_KEY.
    If available, uses Perplexity Sonar. Otherwise, seamlessly falls back
    to zero-cost web search.
    """

    def __init__(self):
        self._zerocost = ZeroCostSearchProvider()

    def get_active_provider(self) -> BaseSearchProvider:
        perplexity_key = os.getenv("PERPLEXITY_API_KEY", "").strip()
        if perplexity_key and len(perplexity_key) > 8 and not perplexity_key.startswith("your_"):
            return PerplexitySearchProvider(api_key=perplexity_key)
        return self._zerocost

    async def search(self, query: str, max_results: int = 5) -> tuple[List[EvidenceSource], str]:
        provider = self.get_active_provider()
        logger.info(f"Using search provider: {provider.name}")
        results = await provider.search(query, max_results=max_results)

        # Fallback to zero-cost if perplexity returned zero results
        if not results and provider.name == "perplexity":
            logger.info("Perplexity yielded no results. Falling back to zero-cost search...")
            results = await self._zerocost.search(query, max_results=max_results)
            return results, "zerocost_fallback"

        return results, provider.name


# Global singleton instance
hybrid_search = HybridSearchService()

