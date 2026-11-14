"""Field Normalization Engine for Agent 2.

Normalizes raw heterogeneous data formats:
- Currencies: Converts $1.2M, INR 50 Lakhs, EUR 500k to standard float and ISO currency codes.
- Financial multipliers: k, M, B, Lakh, Crore, million, billion.
- Percentages: 24%, +15.5%, 0.24 -> 24.0.
- Dates: 2025-09-06, Sep 6 2025, Q3 2024 -> ISO 8601.
- Technology taxonomy: reactjs -> React, python3 -> Python, postgres -> PostgreSQL.
- Stage & Industry taxonomy standardization.
"""

import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple


# Currency exchange rates to USD (reference rates for standardized USD calculations)
CURRENCY_RATES_TO_USD: Dict[str, float] = {
    "USD": 1.0,
    "$": 1.0,
    "EUR": 1.08,
    "€": 1.08,
    "GBP": 1.28,
    "£": 1.28,
    "INR": 0.012,
    "₹": 0.012,
    "CAD": 0.74,
    "AUD": 0.65,
    "JPY": 0.0067,
    "¥": 0.0067,
    "SGD": 0.76,
    "CHF": 1.14,
}

# Currency symbol mapping
CURRENCY_SYMBOL_MAP: Dict[str, str] = {
    "$": "USD",
    "USD": "USD",
    "US$": "USD",
    "€": "EUR",
    "EUR": "EUR",
    "£": "GBP",
    "GBP": "GBP",
    "₹": "INR",
    "INR": "INR",
    "RS": "INR",
    "RS.": "INR",
    "CAD": "CAD",
    "AUD": "AUD",
    "¥": "JPY",
    "JPY": "JPY",
    "SGD": "SGD",
    "CHF": "CHF",
}

# Technology taxonomy canonical dictionary
TECH_CANONICAL_MAP: Dict[str, str] = {
    "react": "React",
    "react.js": "React",
    "reactjs": "React",
    "react native": "React Native",
    "react-native": "React Native",
    "vue": "Vue.js",
    "vue.js": "Vue.js",
    "vuejs": "Vue.js",
    "angular": "Angular",
    "angularjs": "Angular",
    "next": "Next.js",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "node": "Node.js",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "express": "Express",
    "express.js": "Express",
    "expressjs": "Express",
    "python": "Python",
    "python3": "Python",
    "fastapi": "FastAPI",
    "flask": "Flask",
    "django": "Django",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "golang": "Go",
    "go": "Go",
    "rust": "Rust",
    "java": "Java",
    "c#": "C#",
    "csharp": "C#",
    ".net": ".NET",
    "dotnet": ".NET",
    "ruby": "Ruby",
    "rails": "Ruby on Rails",
    "ruby on rails": "Ruby on Rails",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "redis": "Redis",
    "sqlite": "SQLite",
    "supabase": "Supabase",
    "firebase": "Firebase",
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "Google Cloud",
    "google cloud": "Google Cloud",
    "azure": "Microsoft Azure",
    "docker": "Docker",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "graphql": "GraphQL",
    "rest": "REST API",
    "rest api": "REST API",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "langchain": "LangChain",
    "langgraph": "LangGraph",
    "llamaindex": "LlamaIndex",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "gemini": "Google Gemini",
    "openai": "OpenAI",
}

# Standardized Stage Mapping
STAGE_MAP: Dict[str, str] = {
    "idea": "Idea Stage",
    "ideation": "Idea Stage",
    "pre-seed": "Pre-Seed",
    "preseed": "Pre-Seed",
    "seed": "Seed",
    "series-a": "Series A",
    "series a": "Series A",
    "series-b": "Series B",
    "series b": "Series B",
    "series-c": "Series C",
    "series c": "Series C",
    "growth": "Growth",
    "early": "Early Stage",
    "early stage": "Early Stage",
    "expansion": "Expansion",
    "mature": "Mature",
}

# Standardized Industry Mapping
INDUSTRY_MAP: Dict[str, str] = {
    "ai": "Artificial Intelligence",
    "ai/ml": "Artificial Intelligence",
    "artificial intelligence": "Artificial Intelligence",
    "machine learning": "Artificial Intelligence",
    "genai": "Generative AI",
    "generative ai": "Generative AI",
    "fintech": "FinTech",
    "financial technology": "FinTech",
    "healthtech": "HealthTech",
    "healthcare": "HealthTech",
    "biotech": "BioTech",
    "edtech": "EdTech",
    "education": "EdTech",
    "saas": "B2B SaaS",
    "b2b saas": "B2B SaaS",
    "b2b": "B2B Software",
    "b2c": "B2C Software",
    "cybersecurity": "Cybersecurity",
    "security": "Cybersecurity",
    "infosec": "Cybersecurity",
    "ecommerce": "E-Commerce",
    "e-commerce": "E-Commerce",
    "retail": "Retail Tech",
    "cleantech": "ClimateTech",
    "climatetech": "ClimateTech",
    "sustainability": "ClimateTech",
    "devops": "Developer Tools",
    "devtools": "Developer Tools",
    "developer tools": "Developer Tools",
    "proptech": "PropTech",
    "real estate": "PropTech",
    "agritech": "AgriTech",
    "logistics": "Logistics & Supply Chain",
    "supply chain": "Logistics & Supply Chain",
}


def normalize_currency_and_amount(raw_val: Any) -> Tuple[Optional[float], str, Optional[float]]:
    """Parse raw financial string into (original_amount, currency, usd_equivalent).

    Examples:
        "$1.2M" -> (1200000.0, "USD", 1200000.0)
        "₹50 Lakhs" -> (5000000.0, "INR", 60000.0)
        "€500k" -> (500000.0, "EUR", 540000.0)
        "150000" -> (150000.0, "USD", 150000.0)
    """
    if raw_val is None:
        return None, "USD", None

    if isinstance(raw_val, (int, float)):
        val_float = float(raw_val)
        return val_float, "USD", val_float

    raw_str = str(raw_val).strip()
    if not raw_str or raw_str.lower() in ("n/a", "none", "null", "unknown", "tbd"):
        return None, "USD", None

    # Detect currency
    currency = "USD"
    upper_str = raw_str.upper()
    for symbol, code in sorted(CURRENCY_SYMBOL_MAP.items(), key=lambda x: -len(x[0])):
        if symbol in upper_str or symbol in raw_str:
            currency = code
            break

    # Strip symbols and non-numeric except multipliers and decimal points
    cleaned = re.sub(r"[\$,€£₹¥]", "", raw_str, flags=re.IGNORECASE)
    cleaned = re.sub(r"\b(USD|EUR|GBP|INR|CAD|AUD|JPY|SGD|CHF|RS|RS\.)\b", "", cleaned, flags=re.IGNORECASE).strip()

    # Match numeric portion and multiplier
    pattern = r"([+-]?\d+(?:,\d+)*(?:\.\d+)?)\s*([a-zA-Z]+)?"
    match = re.search(pattern, cleaned)
    if not match:
        return None, currency, None

    num_part = match.group(1).replace(",", "")
    unit_part = (match.group(2) or "").lower()

    try:
        base_val = float(num_part)
    except ValueError:
        return None, currency, None

    # Apply multiplier
    multiplier = 1.0
    if unit_part in ("k", "thousand", "thousands"):
        multiplier = 1_000.0
    elif unit_part in ("m", "mn", "million", "millions", "mil"):
        multiplier = 1_000_000.0
    elif unit_part in ("b", "bn", "billion", "billions", "bil"):
        multiplier = 1_000_000_000.0
    elif unit_part in ("t", "trillion"):
        multiplier = 1_000_000_000_000.0
    elif unit_part in ("lakh", "lakhs", "lac", "lacs"):
        multiplier = 100_000.0
        if currency == "USD" and not any(sym in upper_str for sym in ["$", "USD", "EUR", "GBP"]):
            currency = "INR"
    elif unit_part in ("crore", "crores", "cr"):
        multiplier = 10_000_000.0
        if currency == "USD" and not any(sym in upper_str for sym in ["$", "USD", "EUR", "GBP"]):
            currency = "INR"

    original_amount = base_val * multiplier
    fx_rate = CURRENCY_RATES_TO_USD.get(currency, 1.0)
    usd_amount = round(original_amount * fx_rate, 2)

    return original_amount, currency, usd_amount


def normalize_percentage(raw_val: Any) -> Optional[float]:
    """Normalize raw percentage values into standard 0.0 - 100.0+ float.

    Examples:
        "24%" -> 24.0
        "+15.5%" -> 15.5
        "0.24" -> 24.0 (if decimal ratio <= 1.0)
        "85.2" -> 85.2
    """
    if raw_val is None:
        return None

    if isinstance(raw_val, (int, float)):
        val_f = float(raw_val)
        # If passed as decimal ratio like 0.24, convert to 24.0
        if 0 < val_f <= 1.0:
            return round(val_f * 100.0, 2)
        return round(val_f, 2)

    raw_str = str(raw_val).strip()
    if not raw_str or raw_str.lower() in ("n/a", "none", "null", "unknown"):
        return None

    has_percent_sign = "%" in raw_str
    cleaned = re.sub(r"[^\d\.\+\-]", "", raw_str)
    try:
        val_f = float(cleaned)
        if not has_percent_sign and 0 < val_f <= 1.0:
            val_f *= 100.0
        return round(val_f, 2)
    except ValueError:
        return None


def normalize_date(raw_val: Any) -> Optional[str]:
    """Convert various date formats into standardized ISO 8601 (YYYY-MM-DD or YYYY).

    Supports:
        "2025-09-06" -> "2025-09-06"
        "Sep 6, 2025" -> "2025-09-06"
        "September 2024" -> "2024-09-01"
        "06/09/2025" -> "2025-06-09"
        "2023" -> "2023-01-01"
        "Q3 2024" -> "2024-07-01"
    """
    if raw_val is None:
        return None

    raw_str = str(raw_val).strip()
    if not raw_str or raw_str.lower() in ("n/a", "none", "null", "unknown"):
        return None

    # Handle Quarter notation e.g. "Q3 2024" or "2024 Q3"
    q_match = re.search(r"Q([1-4])\s*(\d{4})|(\d{4})\s*Q([1-4])", raw_str, re.IGNORECASE)
    if q_match:
        quarter = int(q_match.group(1) or q_match.group(4))
        year = int(q_match.group(2) or q_match.group(3))
        month = (quarter - 1) * 3 + 1
        return f"{year:04d}-{month:02d}-01"

    # Handle year only e.g. "2023"
    if re.fullmatch(r"\d{4}", raw_str):
        return f"{raw_str}-01-01"

    # Standard date formats to test
    formats = [
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%b %d, %Y",
        "%B %d, %Y",
        "%b %d %Y",
        "%B %d %Y",
        "%d %b %Y",
        "%d %B %Y",
        "%B %Y",
        "%b %Y",
        "%Y-%m",
        "%Y/%m",
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(raw_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue

    # Extract year if possible as fallback
    year_match = re.search(r"\b(19\d{2}|20\d{2})\b", raw_str)
    if year_match:
        return f"{year_match.group(1)}-01-01"

    return raw_str


def normalize_tech_stack(tech_list: List[str]) -> List[str]:
    """Standardize technology names using canonical taxonomy and deduplicate."""
    normalized: List[str] = []
    seen = set()

    for item in tech_list:
        if not item:
            continue
        cleaned = item.strip()
        lower_item = cleaned.lower()

        # Check canonical map
        canonical = TECH_CANONICAL_MAP.get(lower_item)
        if not canonical:
            # Check prefix/suffix stripping
            stripped = re.sub(r"[\s\-_]*(js|ts)$", "", lower_item)
            canonical = TECH_CANONICAL_MAP.get(stripped, cleaned)

        if canonical.lower() not in seen:
            seen.add(canonical.lower())
            normalized.append(canonical)

    return normalized


def normalize_stage(stage_raw: Optional[str]) -> str:
    """Normalize startup lifecycle stage to canonical title."""
    if not stage_raw:
        return "Early Stage"
    key = stage_raw.strip().lower()
    return STAGE_MAP.get(key, stage_raw.strip().title())


def normalize_industry(industry_raw: Optional[str], fallback: str = "Technology") -> str:
    """Normalize industry title to canonical category."""
    if not industry_raw:
        return fallback
    key = industry_raw.strip().lower()
    return INDUSTRY_MAP.get(key, industry_raw.strip().title())


def normalize_runway_months(runway_raw: Any) -> Optional[float]:
    """Extract numeric runway months from strings like '18 months', '1.5 years', etc."""
    if runway_raw is None:
        return None
    if isinstance(runway_raw, (int, float)):
        return float(runway_raw)

    raw_str = str(runway_raw).strip().lower()
    if not raw_str or raw_str in ("n/a", "none", "null", "unknown"):
        return None

    # Check for years notation
    year_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:year|yrs|y)", raw_str)
    if year_match:
        try:
            return round(float(year_match.group(1)) * 12.0, 1)
        except ValueError:
            pass

    # Check for months notation
    month_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:month|mos|m)", raw_str)
    if month_match:
        try:
            return round(float(month_match.group(1)), 1)
        except ValueError:
            pass

    # Bare numeric extraction
    num_match = re.search(r"(\d+(?:\.\d+)?)", raw_str)
    if num_match:
        try:
            return round(float(num_match.group(1)), 1)
        except ValueError:
            pass

    return None
