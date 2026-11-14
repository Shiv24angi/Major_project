# Nivesh External Research Engine (Tasks 5–9)

The **External Research Engine** (`Agent-Research`) provides external intelligence, automated web discovery, controlled crawling, evidence validation, and deep venture market research for the **Nivesh / VentureLens** platform.

---

## 🏗️ Architecture & Tasks

| Task | Capability | Implementation Status |
| :--- | :--- | :--- |
| **Task 5** | **Web Crawler & Research Base Engine** | ✅ **Implemented & Verified** (Async polite crawler, robots.txt, HTML-to-Markdown, evidence validation) |
| **Task 6** | **Market & Industry Research** | ✅ **Implemented & Verified** (TAM, SAM, SOM, CAGR, tailwinds/headwinds, ICP, Market Attractiveness Score) |
| **Task 7** | **Competitor Research** | ✅ **Implemented & Verified** (Direct/indirect/incumbent profiling, feature matrix, Porter's forces, defensibility moat score) |
| **Task 8** | **Financial & Funding Research** | ✅ **Implemented & Verified** (Funding rounds, investor tracking, ARR multiples, burn/runway, Financial Health Score) |
| **Task 9** | **News & Sector Developments** | ✅ **Implemented & Verified** (Chronological event timeline, press announcements, sector shifts, News Momentum Score) |

---

## 🚀 Quickstart

### 1. Configuration
The `.env` file is located at `Agent-Research/backend/.env`.

```env
PORT=8002
HOST=0.0.0.0

# Gemini API Key (reused from Agent-6)
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash

# Perplexity API Key (optional - zero-cost mode runs if omitted)
PERPLEXITY_API_KEY=

# Supabase
SUPABASE_URL=https://kvcpmybvjllnddxzmnzr.supabase.co
SUPABASE_ANON_KEY=...
```

### 2. Start the FastAPI Service (Port 8002)
```bash
cd Agent-Research/backend
python -m uvicorn app.main:app --port 8002 --reload
```

Interactive Swagger API documentation:
👉 **http://localhost:8002/docs**

### 3. Run Automated Tests
```bash
python -m pytest .\Agent-Research\backend\tests -v
```

---

## 📡 Key Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Service status, supported tasks, and documentation |
| `/research/health` | `GET` | Health check & search provider status (Perplexity vs Zero-Cost) |
| `/research/crawl` | `POST` | Batch crawl URLs, obey robots.txt, and extract clean Markdown |
| `/research/crawl-single` | `POST` | Crawl a single target URL |
| `/research/validate-evidence` | `POST` | Score domain authority, timestamp freshness, and claim grounding |
| `/research/search-and-extract` | `POST` | Unified pipeline: discover URLs, validate sources, crawl and parse |
| `/research/market` | `POST` | Task 6: TAM, SAM, SOM, CAGR, market tailwinds/headwinds, ICP, and Market Score |
| `/research/competitors` | `POST` | Task 7: Direct/indirect/incumbent profiles, feature matrix, Porter's forces, and Moat Score |
| `/research/financials` | `POST` | Task 8: Funding rounds, lead investors, ARR valuation multiples, burn/runway, and Financial Score |
| `/research/news` | `POST` | Task 9: Press announcements, chronological milestone timeline, sector shifts, and Momentum Score |
| `/research/full-diligence` | `POST` | Master Orchestrator: Concurrently runs Tasks 6–9, computes Composite Score & Recommendation, persists to Supabase |
