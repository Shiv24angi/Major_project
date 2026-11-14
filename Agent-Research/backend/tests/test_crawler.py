import pytest
from unittest.mock import AsyncMock, MagicMock
from crawler.parser import page_parser
from crawler.robots import RobotsManager


def test_page_parser_metadata_and_markdown():
    sample_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Nivesh AI - Automated Venture Due Diligence</title>
        <meta property="og:title" content="Nivesh AI Platform" />
        <meta property="og:description" content="AI Startup Evaluation & Due Diligence" />
        <meta property="article:published_time" content="2026-03-15T09:00:00Z" />
        <meta name="author" content="Venture Research Team" />
    </head>
    <body>
        <nav><a href="/home">Home</a><a href="/login">Login</a></nav>
        <main>
            <h1>Investment Diligence Engine</h1>
            <p>Nivesh accelerates early-stage venture capital diligence by automating research.</p>
            <h2>Core Capabilities</h2>
            <ul>
                <li>Automated pitch deck extraction</li>
                <li>Codebase AST verification</li>
                <li>External market & competitor intelligence</li>
            </ul>
        </main>
        <footer>Copyright 2026 Nivesh</footer>
        <script>console.log("tracking");</script>
    </body>
    </html>
    """
    parsed = page_parser.parse(sample_html, "https://nivesh.ai/product")

    assert parsed.title == "Nivesh AI Platform"
    assert "AI Startup Evaluation" in parsed.description
    assert parsed.published_date == "2026-03-15T09:00:00Z"
    assert parsed.author == "Venture Research Team"

    # Check that navigation, footer, and scripts are stripped
    assert "Login" not in parsed.clean_markdown
    assert "tracking" not in parsed.clean_markdown
    assert "Copyright" not in parsed.clean_markdown

    # Check markdown headers and content
    assert "# Investment Diligence Engine" in parsed.clean_markdown
    assert "## Core Capabilities" in parsed.clean_markdown
    assert "- Automated pitch deck extraction" in parsed.clean_markdown
    assert len(parsed.headings) >= 2


def test_robots_manager_parsing():
    manager = RobotsManager()
    robots_text = "User-agent: *\nDisallow: /admin/\nDisallow: /private/\nAllow: /public/\n"

    manager.parse_robots_txt("https://example.com", robots_text)

    allowed = manager.is_allowed("https://example.com/public/article")
    blocked = manager.is_allowed("https://example.com/admin/settings")

    assert allowed is True
    assert blocked is False
