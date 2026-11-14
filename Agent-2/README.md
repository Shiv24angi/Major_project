# VentureLens Agent 2: Data Extraction & Normalization

Agent 2 serves as the central data harmonization, validation, and conflict resolution layer in the **VentureLens AI Startup Evaluation Platform**.

---

## 🌟 Overview

Agent 2 synthesizes heterogeneous intelligence gathered from:
- **Agent 1 (Pitch Decks / Document Intelligence)**: Raw unstructured claims, financial statements, team profiles, and market sizing.
- **Agent 6 (Codebase / GitHub Diligence)**: Static AST analysis, repository architecture, verified features, and code concerns.
- **Agent-Research (External Market Intelligence)**: Verified web research, market size benchmarks, competitors, funding rounds, and recent developments.

It produces a single, unified, structured evaluation dataset consumed directly by **Agent 3 (Startup Scoring Engine)** and surfaces audit trails to the investor dashboard.

```
+-------------------+     +---------------------+     +-----------------------+
|      Agent 1      |     |       Agent 6       |     |    Agent-Research     |
| (Pitch Decks/PDF) |     |  (Code AST / Git)   |     | (Web / Macro Data)    |
+---------+---------+     +----------+----------+     +-----------+-----------+
          |                          |                            |
          +--------------------+     |     +----------------------+
                               |     |     |
                               v     v     v
                  +-----------------------------------+
                  |              AGENT 2              |
                  |  Data Extraction & Normalization  |
                  |                                   |
                  |  • Currency & Multiplier Parser   |
                  |  • ISO 8601 Date Standardization  |
                  |  • Tech & Industry Taxonomy       |
                  |  • Duplicate Clustered Detection  |
                  |  • Source-Authority Conflicts     |
                  |  • Cross-Metric Auditing (ARR/MRR)|
                  +-----------------+-----------------+
                                    |
          +-------------------------+-------------------------+
          |                                                   |
          v                                                   v
+-------------------------------+               +-------------------------------+
|     Supabase PostgreSQL       |               |            Agent 3            |
| (normalized_startup_profiles) |               |    (Startup Scoring Engine)   |
+-------------------------------+               +-------------------------------+
```

---

## 🚀 Key Features

1. **Deterministic Multiplier & Currency Normalization**:
   - Parses financial strings (`$1.2M`, `₹50 Lakhs`, `€500k`, `10B`, `5 Cr`) into exact numeric floats with standard currency ISO codes and USD reference calculations.
2. **Cross-Metric Consistency & Logic Checks**:
   - Audits whether reported ARR matches annualized MRR (`arr ≈ mrr * 12`).
   - Verifies market sizing sanity (`TAM >= SAM >= SOM`).
   - Computes and flags unit economics (`LTV/CAC < 1.0` warning).
   - Validates margin bounds (`gross_margin <= 100%`).
3. **Deduplication Engine**:
   - Exact and fuzzy deduplication on competitor names, risk factors, and founder leadership profiles.
4. **Explainable Conflict Resolution**:
   - Ground truth source hierarchy: Agent 6 code AST takes precedence over pitch deck feature claims; external verified market data takes precedence over pitch deck market projections.
   - Preserves both original values and transparent resolution rationale in `ConflictRecord`.
5. **End-to-End Field Provenance**:
   - Every single metric maps to originating agent, confidence score, and timestamp in `source_provenance`.
6. **Dual-Layer Persistence**:
   - Persists to Supabase table `public.normalized_startup_profiles` via PostgREST and stores offline resilient JSON runs in `storage/normalized_outputs/`.

---

## 🛠️ API Endpoints (Port 8003)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/agent2/normalize` | Execute full normalization on composite request payload |
| `POST` | `/api/v1/agent2/fetch-and-normalize` | Auto-fetch data from sibling agents / Supabase and normalize |
| `GET` | `/api/v1/agent2/{analysis_id}` | Retrieve normalized dataset by analysis ID |
| `GET` | `/api/v1/agent2/{analysis_id}/status` | Inspect status, confidence score, and issue counts |
| `GET` | `/api/v1/agent2/runs/all` | List all historical normalization runs |
| `GET` | `/health` | Service health check |

---

## 💻 Running Locally

### 1. Installation
```bash
cd Agent-2/backend
pip install -r requirements.txt
```

### 2. Configuration (`.env`)
```env
PORT=8003
HOST=0.0.0.0
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
AGENT6_API_BASE=http://localhost:8000
```

### 3. Start Server
```bash
uvicorn app.main:app --port 8003 --reload
```

### 4. Running the Test Suite
```bash
python -m pytest tests/test_normalization.py -v
```
All 14 comprehensive test cases covering normalization, deduplication, conflict resolution, validation, and end-to-end pipeline execution will run and pass.

