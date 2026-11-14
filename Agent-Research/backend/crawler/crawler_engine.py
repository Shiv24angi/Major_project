import asyncio
from datetime import datetime, timezone
import logging
from typing import List, Set
from urllib.parse import urlparse
import httpx

from crawler.fetcher import PageFetcher, page_fetcher
from crawler.parser import PageParser, page_parser
from crawler.robots import RobotsManager, robots_manager
from schemas.research_schemas import CrawlMetadata, CrawlResult

logger = logging.getLogger("crawler.engine")


class CrawlerEngine:
    """
    Controlled, asynchronous crawling engine that balances speed,
    robots.txt politeness, memory boundaries, and structured extraction.
    """

    def __init__(
        self,
        fetcher: PageFetcher = page_fetcher,
        parser: PageParser = page_parser,
        robots: RobotsManager = robots_manager,
    ):
        self.fetcher = fetcher
        self.parser = parser
        self.robots = robots

    def _get_domain(self, url: str) -> str:
        try:
            return urlparse(url).netloc.lower()
        except Exception:
            return ""

    async def crawl_url(
        self,
        url: str,
        respect_robots: bool = True,
        client: httpx.AsyncClient = None,
    ) -> CrawlResult:
        """
        Crawl and parse a single URL with robots.txt check and metadata extraction.
        """
        domain = self._get_domain(url)
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Robots.txt check
        if respect_robots:
            try:
                allowed = await self.robots.can_fetch(url, client=client)
                if not allowed:
                    logger.info(f"URL blocked by robots.txt: {url}")
                    return CrawlResult(
                        url=url,
                        status="blocked_by_robots",
                        metadata=CrawlMetadata(
                            domain=domain,
                            status_code=403,
                            crawled_at=now_iso,
                        ),
                        clean_markdown="",
                        raw_text="",
                        error="Target URL disallowed by website robots.txt rules",
                    )
            except Exception as e:
                logger.warning(f"Error checking robots.txt for {url}: {e}")

        # 2. Fetch page
        resp = await self.fetcher.fetch(url, client=client)
        if not resp.is_success:
            status_code = resp.status_code if resp.status_code > 0 else 500
            err_msg = resp.error or f"HTTP {status_code}"
            status = "timeout" if status_code == 408 else "failed"

            return CrawlResult(
                url=url,
                status=status,
                metadata=CrawlMetadata(
                    domain=domain,
                    status_code=status_code,
                    content_type=resp.content_type,
                    crawled_at=now_iso,
                ),
                clean_markdown="",
                raw_text="",
                error=err_msg,
            )

        # 3. Parse and extract structured representation
        try:
            parsed = self.parser.parse(resp.content, source_url=resp.url)

            metadata = CrawlMetadata(
                title=parsed.title,
                description=parsed.description,
                published_date=parsed.published_date,
                author=parsed.author,
                domain=domain,
                status_code=resp.status_code,
                content_type=resp.content_type,
                crawled_at=now_iso,
            )

            return CrawlResult(
                url=resp.url,
                status="success",
                metadata=metadata,
                clean_markdown=parsed.clean_markdown,
                raw_text=parsed.raw_text,
                headings=parsed.headings,
                links=parsed.links,
                error=None,
            )
        except Exception as e:
            logger.error(f"Failed to parse content for {url}: {e}")
            return CrawlResult(
                url=resp.url,
                status="failed",
                metadata=CrawlMetadata(
                    domain=domain,
                    status_code=resp.status_code,
                    content_type=resp.content_type,
                    crawled_at=now_iso,
                ),
                clean_markdown="",
                raw_text="",
                error=f"Parsing error: {str(e)}",
            )

    async def crawl_batch(
        self,
        urls: List[str],
        concurrency: int = 3,
        respect_robots: bool = True,
    ) -> List[CrawlResult]:
        """
        Crawl a list of URLs concurrently with bounded worker semaphore.
        """
        semaphore = asyncio.Semaphore(concurrency)
        client = httpx.AsyncClient(
            timeout=httpx.Timeout(15.0, connect=6.0),
            follow_redirects=True,
            verify=True,
        )

        async def _bounded_crawl(u: str) -> CrawlResult:
            async with semaphore:
                return await self.crawl_url(u, respect_robots=respect_robots, client=client)

        try:
            tasks = [_bounded_crawl(url) for url in urls]
            results = await asyncio.gather(*tasks, return_exceptions=False)
            return results
        finally:
            await client.aclose()

    async def crawl_domain(
        self,
        seed_url: str,
        max_depth: int = 1,
        max_pages: int = 5,
        concurrency: int = 2,
        respect_robots: bool = True,
    ) -> List[CrawlResult]:
        """
        Domain-scoped breadth-first crawler. Follows internal links up to max_depth and max_pages.
        """
        root_domain = self._get_domain(seed_url)
        if not root_domain:
            return []

        visited: Set[str] = set()
        queue: List[tuple] = [(seed_url, 0)]  # (url, depth)
        results: List[CrawlResult] = []

        client = httpx.AsyncClient(
            timeout=httpx.Timeout(15.0, connect=6.0),
            follow_redirects=True,
            verify=True,
        )

        try:
            while queue and len(results) < max_pages:
                current_batch = queue[:concurrency]
                queue = queue[concurrency:]

                batch_tasks = []
                for current_url, depth in current_batch:
                    if current_url in visited:
                        continue
                    visited.add(current_url)
                    batch_tasks.append((current_url, depth))

                if not batch_tasks:
                    continue

                crawl_jobs = [
                    self.crawl_url(u, respect_robots=respect_robots, client=client)
                    for u, _ in batch_tasks
                ]
                batch_results = await asyncio.gather(*crawl_jobs, return_exceptions=True)

                for (u, depth), res in zip(batch_tasks, batch_results):
                    if isinstance(res, Exception):
                        continue
                    results.append(res)
                    if len(results) >= max_pages:
                        break

                    # If within depth budget, discover internal domain links
                    if depth < max_depth and res.status == "success":
                        for link in res.links:
                            link_domain = self._get_domain(link)
                            if (link_domain == root_domain or link_domain.endswith(f".{root_domain}")):
                                if link not in visited and all(link != item[0] for item in queue):
                                    queue.append((link, depth + 1))

            return results
        finally:
            await client.aclose()


# Global engine instance
crawler_engine = CrawlerEngine()

