import json
import re
from datetime import datetime
from typing import Dict, List, Optional
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup, Comment


class ParsedPage:
    def __init__(
        self,
        title: str,
        description: str,
        published_date: Optional[str],
        author: Optional[str],
        clean_markdown: str,
        raw_text: str,
        headings: List[str],
        links: List[str],
    ):
        self.title = title
        self.description = description
        self.published_date = published_date
        self.author = author
        self.clean_markdown = clean_markdown
        self.raw_text = raw_text
        self.headings = headings
        self.links = links


class PageParser:
    """
    Extracts structured metadata, article publication timestamps,
    and converts noisy HTML into clean, token-efficient Markdown for LLM synthesis.
    """

    NOISE_TAGS = [
        "script", "style", "noscript", "svg", "canvas", "header", "footer",
        "nav", "aside", "form", "button", "iframe", "embed", "object"
    ]

    NOISE_CLASSES_OR_IDS = re.compile(
        r"(advert|banner|cookie|gdpr|newsletter|popup|modal|social-share|sidebar|footer-nav|promo)",
        re.I
    )

    def parse(self, html: str, source_url: str) -> ParsedPage:
        if not html or not html.strip():
            return ParsedPage(
                title="",
                description="",
                published_date=None,
                author=None,
                clean_markdown="",
                raw_text="",
                headings=[],
                links=[],
            )

        # Try lxml parser first, fallback to html.parser
        try:
            soup = BeautifulSoup(html, "lxml")
        except Exception:
            soup = BeautifulSoup(html, "html.parser")

        # 1. Extract Metadata Before stripping tags
        title = self._extract_title(soup)
        description = self._extract_description(soup)
        published_date = self._extract_date(soup)
        author = self._extract_author(soup)

        # 2. Extract outbound links (made absolute)
        links = self._extract_links(soup, source_url)

        # 3. Strip HTML comments & noise elements
        for comment in soup.find_all(string=lambda s: isinstance(s, Comment)):
            comment.extract()

        for tag_name in self.NOISE_TAGS:
            for elem in soup.find_all(tag_name):
                elem.decompose()

        for noise_elem in soup.find_all(class_=self.NOISE_CLASSES_OR_IDS):
            noise_elem.decompose()

        # 4. Extract headings
        headings = []
        for h in soup.find_all(["h1", "h2", "h3"]):
            text = h.get_text(strip=True)
            if text and len(text) > 3 and text not in headings:
                headings.append(text)

        # 5. Locate main content container (article, main, or body)
        main_content = (
            soup.find("article")
            or soup.find("main")
            or soup.find(role="main")
            or soup.find("div", id=re.compile(r"(content|article|body|post)", re.I))
            or soup.body
            or soup
        )

        clean_md = self._html_to_markdown(main_content)
        raw_text = re.sub(r"\s+", " ", main_content.get_text(separator=" ")).strip()

        return ParsedPage(
            title=title,
            description=description,
            published_date=published_date,
            author=author,
            clean_markdown=clean_md,
            raw_text=raw_text,
            headings=headings[:15],
            links=links[:30],
        )

    def _extract_title(self, soup: BeautifulSoup) -> str:
        # Check og:title, twitter:title, then <title>, then first h1
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            return og_title["content"].strip()

        tw_title = soup.find("meta", attrs={"name": "twitter:title"})
        if tw_title and tw_title.get("content"):
            return tw_title["content"].strip()

        if soup.title and soup.title.string:
            return soup.title.string.strip()

        h1 = soup.find("h1")
        if h1:
            return h1.get_text(strip=True)

        return ""

    def _extract_description(self, soup: BeautifulSoup) -> str:
        og_desc = soup.find("meta", property="og:description")
        if og_desc and og_desc.get("content"):
            return og_desc["content"].strip()

        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content"):
            return meta_desc["content"].strip()

        return ""

    def _extract_date(self, soup: BeautifulSoup) -> Optional[str]:
        # Check meta article:published_time, publication date tags, or JSON-LD
        date_candidates = [
            ("meta", {"property": "article:published_time"}),
            ("meta", {"name": "publication_date"}),
            ("meta", {"name": "date"}),
            ("meta", {"name": "parsely-pub-date"}),
            ("meta", {"property": "og:updated_time"}),
        ]
        for tag, attrs in date_candidates:
            elem = soup.find(tag, attrs=attrs)
            if elem and elem.get("content"):
                return elem["content"].strip()

        # Check <time datetime="...">
        time_tag = soup.find("time")
        if time_tag:
            if time_tag.get("datetime"):
                return time_tag["datetime"].strip()
            if time_tag.get_text(strip=True):
                return time_tag.get_text(strip=True)

        # Check JSON-LD
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string or "")
                if isinstance(data, dict):
                    if "datePublished" in data:
                        return str(data["datePublished"])
                    if "dateCreated" in data:
                        return str(data["dateCreated"])
                elif isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict) and "datePublished" in item:
                            return str(item["datePublished"])
            except Exception:
                pass

        return None

    def _extract_author(self, soup: BeautifulSoup) -> Optional[str]:
        meta_author = soup.find("meta", attrs={"name": "author"}) or soup.find("meta", property="article:author")
        if meta_author and meta_author.get("content"):
            return meta_author["content"].strip()
        return None

    def _extract_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        links = []
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if href.startswith(("#", "javascript:", "mailto:", "tel:")):
                continue
            abs_url = urljoin(base_url, href)
            parsed = urlparse(abs_url)
            if parsed.scheme in ("http", "https") and abs_url not in links:
                links.append(abs_url)
        return links

    def _html_to_markdown(self, element) -> str:
        lines: List[str] = []

        for child in element.descendants:
            if child.name in ["h1", "h2", "h3", "h4"]:
                prefix = "#" * int(child.name[1])
                text = child.get_text(strip=True)
                if text:
                    lines.append(f"\n{prefix} {text}\n")
            elif child.name == "p":
                text = child.get_text(strip=True)
                if text and len(text) > 15:
                    lines.append(f"\n{text}\n")
            elif child.name == "li":
                text = child.get_text(strip=True)
                if text:
                    lines.append(f"- {text}")
            elif child.name == "blockquote":
                text = child.get_text(strip=True)
                if text:
                    lines.append(f"> {text}\n")

        raw_md = "\n".join(lines)
        # Collapse multiple empty lines
        cleaned_md = re.sub(r"\n{3,}", "\n\n", raw_md).strip()

        # Fallback if specific tags missed body text
        if len(cleaned_md) < 80:
            cleaned_md = element.get_text(separator="\n\n", strip=True)
            cleaned_md = re.sub(r"\n{3,}", "\n\n", cleaned_md).strip()

        return cleaned_md


# Global page parser instance
page_parser = PageParser()
