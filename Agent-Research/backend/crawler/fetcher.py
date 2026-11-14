import logging
import time
from typing import Dict, Optional, Tuple
from urllib.parse import urlparse
import httpx

logger = logging.getLogger("crawler.fetcher")

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36 (compatible; NiveshResearchBot/1.0; +https://nivesh.ai/bot)"
)

ALLOWED_CONTENT_TYPES = (
    "text/html",
    "text/plain",
    "application/xhtml+xml",
    "application/json",
    "text/xml",
)

MAX_BODY_BYTES = 5 * 1024 * 1024  # 5 MB safety ceiling


class FetchResponse:
    def __init__(
        self,
        url: str,
        status_code: int,
        content: str,
        content_type: str,
        headers: Dict[str, str],
        elapsed_ms: int,
        error: Optional[str] = None,
    ):
        self.url = url
        self.status_code = status_code
        self.content = content
        self.content_type = content_type
        self.headers = headers
        self.elapsed_ms = elapsed_ms
        self.error = error

    @property
    def is_success(self) -> bool:
        return 200 <= self.status_code < 300 and self.error is None


class PageFetcher:
    """
    Robust, asynchronous web page fetcher with header rotation,
    streaming size limit protection, and content-type validation.
    """

    def __init__(
        self,
        user_agent: str = DEFAULT_USER_AGENT,
        timeout: float = 15.0,
        verify_ssl: bool = True,
    ):
        self.user_agent = user_agent
        self.timeout = timeout
        self.verify_ssl = verify_ssl

    def _default_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": self.user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "cross-site",
            "Upgrade-Insecure-Requests": "1",
        }

    async def fetch(
        self,
        url: str,
        client: Optional[httpx.AsyncClient] = None,
    ) -> FetchResponse:
        start_time = time.time()
        should_close = False

        if client is None:
            client = httpx.AsyncClient(
                timeout=httpx.Timeout(self.timeout, connect=6.0),
                follow_redirects=True,
                verify=self.verify_ssl,
            )
            should_close = True

        headers = self._default_headers()

        try:
            # Normalize scheme if user passed bare hostname
            if not url.startswith("http://") and not url.startswith("https://"):
                url = f"https://{url}"

            # Stream first to check Content-Length & Content-Type before downloading large files
            async with client.stream("GET", url, headers=headers) as resp:
                elapsed_ms = int((time.time() - start_time) * 1000)
                content_type = resp.headers.get("content-type", "").lower()

                # Validate content-type
                is_allowed_type = any(t in content_type for t in ALLOWED_CONTENT_TYPES) or not content_type
                if not is_allowed_type:
                    return FetchResponse(
                        url=str(resp.url),
                        status_code=resp.status_code,
                        content="",
                        content_type=content_type,
                        headers=dict(resp.headers),
                        elapsed_ms=elapsed_ms,
                        error=f"Unsupported Content-Type: {content_type}",
                    )

                # Validate Content-Length if reported
                content_length = resp.headers.get("content-length")
                if content_length and int(content_length) > MAX_BODY_BYTES:
                    return FetchResponse(
                        url=str(resp.url),
                        status_code=resp.status_code,
                        content="",
                        content_type=content_type,
                        headers=dict(resp.headers),
                        elapsed_ms=elapsed_ms,
                        error=f"Content exceeds size limit ({content_length} bytes)",
                    )

                # Read response text with byte limit
                chunks = []
                total_bytes = 0
                async for chunk in resp.aiter_bytes():
                    total_bytes += len(chunk)
                    if total_bytes > MAX_BODY_BYTES:
                        return FetchResponse(
                            url=str(resp.url),
                            status_code=resp.status_code,
                            content="",
                            content_type=content_type,
                            headers=dict(resp.headers),
                            elapsed_ms=elapsed_ms,
                            error="Downloaded content exceeded size ceiling",
                        )
                    chunks.append(chunk)

                raw_bytes = b"".join(chunks)
                # Decode text with charset fallback
                encoding = resp.encoding or "utf-8"
                try:
                    text_content = raw_bytes.decode(encoding, errors="replace")
                except Exception:
                    text_content = raw_bytes.decode("utf-8", errors="replace")

                return FetchResponse(
                    url=str(resp.url),
                    status_code=resp.status_code,
                    content=text_content,
                    content_type=content_type,
                    headers=dict(resp.headers),
                    elapsed_ms=elapsed_ms,
                )

        except httpx.TimeoutException:
            elapsed_ms = int((time.time() - start_time) * 1000)
            return FetchResponse(
                url=url,
                status_code=408,
                content="",
                content_type="",
                headers={},
                elapsed_ms=elapsed_ms,
                error=f"Timeout after {self.timeout}s connecting to {url}",
            )
        except httpx.ConnectError as e:
            elapsed_ms = int((time.time() - start_time) * 1000)
            return FetchResponse(
                url=url,
                status_code=502,
                content="",
                content_type="",
                headers={},
                elapsed_ms=elapsed_ms,
                error=f"Connection failed: {str(e)}",
            )
        except Exception as e:
            elapsed_ms = int((time.time() - start_time) * 1000)
            return FetchResponse(
                url=url,
                status_code=500,
                content="",
                content_type="",
                headers={},
                elapsed_ms=elapsed_ms,
                error=f"Fetch failed: {str(e)}",
            )
        finally:
            if should_close:
                await client.aclose()


# Global default fetcher
page_fetcher = PageFetcher()

