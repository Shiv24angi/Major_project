import logging
from typing import Dict, Optional, Tuple
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser
import httpx

logger = logging.getLogger("crawler.robots")


class RobotsManager:
    """
    In-memory cached robots.txt parser with politeness delays.
    Respects RFC 9309 / standard robots.txt specifications.
    """

    def __init__(self, user_agent: str = "NiveshResearchBot"):
        self.user_agent = user_agent
        # Cache key: domain scheme+netloc -> (RobotFileParser, crawl_delay_seconds)
        self._cache: Dict[str, Tuple[RobotFileParser, Optional[float]]] = {}

    def _extract_base_url(self, url: str) -> str:
        parsed = urlparse(url)
        return f"{parsed.scheme or 'https'}://{parsed.netloc}"

    def parse_robots_txt(self, base_url: str, text: str) -> None:
        """Parse raw robots.txt text and store directly in cache."""
        parser = RobotFileParser()
        parser.parse(text.splitlines())
        parser.modified()
        try:
            delay = parser.crawl_delay(self.user_agent)
        except Exception:
            delay = None
        self._cache[base_url] = (parser, delay)

    def is_allowed(self, url: str) -> bool:
        """Synchronously check cache if domain is already parsed."""
        base_url = self._extract_base_url(url)
        if base_url in self._cache:
            parser, _ = self._cache[base_url]
            try:
                return parser.can_fetch(self.user_agent, url)
            except Exception:
                return True
        return True

    async def can_fetch(self, url: str, client: Optional[httpx.AsyncClient] = None) -> bool:
        """
        Check if the target URL is permitted to be crawled according to robots.txt.
        If robots.txt is missing (404) or unreachable, standard crawling rules permit access.
        """
        base_url = self._extract_base_url(url)
        if not base_url or "://" not in base_url or len(urlparse(url).netloc) < 3:
            return False

        if base_url not in self._cache:
            await self._load_robots(base_url, client)

        parser, _ = self._cache[base_url]
        try:
            return parser.can_fetch(self.user_agent, url)
        except Exception as e:
            logger.warning(f"Error evaluating robots.txt for {url}: {e}. Permitting by default.")
            return True

    def get_crawl_delay(self, url: str) -> Optional[float]:
        """Get the crawl-delay specified in robots.txt for our user agent, if any."""
        base_url = self._extract_base_url(url)
        if base_url in self._cache:
            _, delay = self._cache[base_url]
            return delay
        return None

    async def _load_robots(self, base_url: str, client: Optional[httpx.AsyncClient] = None) -> None:
        robots_url = f"{base_url}/robots.txt"
        parser = RobotFileParser()

        crawl_delay: Optional[float] = None
        should_close_client = False

        if client is None:
            client = httpx.AsyncClient(timeout=10.0, follow_redirects=True)
            should_close_client = True

        try:
            headers = {
                "User-Agent": self.user_agent,
                "Accept": "text/plain,*/*"
            }
            resp = await client.get(robots_url, headers=headers)
            if resp.status_code == 200:
                parser.parse(resp.text.splitlines())
                parser.modified()
                try:
                    crawl_delay = parser.crawl_delay(self.user_agent)
                except Exception:
                    crawl_delay = None
            else:
                # 404 or non-200 generally means no restrictions
                parser.parse([])
                parser.modified()
        except Exception as e:
            logger.debug(f"Could not fetch robots.txt for {base_url} ({e}). Assuming unrestricted.")
            parser.parse([])
            parser.modified()
        finally:
            if should_close_client:
                await client.aclose()

        self._cache[base_url] = (parser, crawl_delay)


# Global singleton instance
robots_manager = RobotsManager()
