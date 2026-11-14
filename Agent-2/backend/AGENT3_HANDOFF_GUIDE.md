# Agent 2 → Agent 3 Integration & Handoff Guide

This guide specifies how **Agent 3 (Startup Scoring & Evaluation Engine)** consumes the unified, validated, and normalized startup evaluation datasets produced by **Agent 2 (Data Extraction & Normalization)**.

---

## 🎯 Purpose of Agent 2 Output for Agent 3

Agent 2 eliminates data chaos for Agent 3. It standardizes disparate inputs from:
1. **Agent 1**: Document Intelligence (Pitch decks, business models, financial claims).
2. **Agent 6**: Codebase & Repository Diligence (AST verification, code maturity, feature ground truth).
3. **Agent-Research / External Research**: Verified web research, market benchmarks, competitors, funding rounds, news.

Agent 3 does **not** need to parse raw pitch deck strings like `"$1.2M"` or reconcile conflicting market figures. Everything is pre-calculated, validated, and attributed.

---

## 📍 Where Agent 2 Output is Stored

Whenever Agent 2 runs (via API or pipeline), its normalized dataset is saved into:

### 1. Supabase PostgreSQL Table (`public.normalized_startup_profiles`)
- **Table Name**: `public.normalized_startup_profiles`
- **Primary Key**: `id` (`norm_<12char_hex>`)
- **Foreign Key**: `analysis_id` references `public.analyses(id)`
- **Query Example**:
  ```sql
  SELECT * FROM public.normalized_startup_profiles
  WHERE analysis_id = 'YOUR_ANALYSIS_ID'
  ORDER BY created_at DESC LIMIT 1;
  ```

### 2. Local Resilient JSON Storage
- **Directory**: `Agent-2/backend/storage/normalized_outputs/`
- **Global Latest**: `latest.json`
- **Analysis-Specific Latest**: `latest_<analysis_id>.json`
- **Indexed Registry**: `index.json`

---

## 🛠️ How Agent 3 Accesses Normalized Data

### Method 1: HTTP REST API (Recommended for microservice orchestration)

When Agent 2 is running on port **8003** (`http://localhost:8003`):

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/agent2/{analysis_id}` | `GET` | Retrieve normalized dataset by analysis ID |
| `/api/v1/agent2/{analysis_id}/status` | `GET` | Retrieve status, confidence score, and issue counts |
| `/api/v1/agent2/normalize` | `POST` | On-demand normalization of custom payload |
| `/api/v1/agent2/fetch-and-normalize` | `POST` | Auto-fetch from upstream siblings & normalize |

**Python Example for Agent 3:**
```python
import httpx

async def get_normalized_startup_profile(analysis_id: str) -> dict:
    url = f"http://localhost:8003/api/v1/agent2/{analysis_id}"
    async with httpx.AsyncClient(timeout=8.0) as client:
        resp = await client.get(url)
        if resp.status_code == 200:
            return resp.json()
        raise RuntimeError(f"Agent 2 data not found for {analysis_id}")
```

### Method 2: Direct Local Storage Read (Offline Fallback)
```python
from pathlib import Path
import json

STORAGE_DIR = Path("Agent-2/backend/storage/normalized_outputs")

def get_latest_profile() -> dict:
    with open(STORAGE_DIR / "latest.json", "r", encoding="utf-8") as f:
        return json.load(f)
```

---

## 📦 Standard Dataset Schema (`UnifiedStartupEvaluationDataset`)

```json
{
  "id": "norm_4f1b2c3d4e5f",
  "analysis_id": "eval_001",
  "startup_id": "startup_xyz",
  "normalization_status": "completed",
  "overall_confidence_score": 0.88,

  "startup_profile": {
    "canonical_name": "CloudMatrix AI",
    "description": "Enterprise API orchestration and security platform.",
    "primary_industry": "B2B SaaS",
    "stage": "Seed",
    "website": "https://cloudmatrix.ai",
    "github_url": "https://github.com/cloudmatrix/core"
  },

  "business_information": {
    "business_model": "B2B SaaS / Enterprise Subscription",
    "monetization_structure": ["B2B SaaS"],
    "competitors": ["Kong", "Apigee", "Tyk"],
    "risk_factors": ["API security regulations", "Vendor lock-in"]
  },

  "financial_information": {
    "currency": "USD",
    "annual_recurring_revenue": 2400000.0,
    "monthly_recurring_revenue": 200000.0,
    "total_capital_raised": 4500000.0,
    "monthly_burn_rate": 80000.0,
    "runway_months": 18.0,
    "gross_margin_percentage": 78.0,
    "annual_growth_rate_percentage": 120.0,
    "churn_rate_percentage": 1.8,
    "cac": 2500.0,
    "ltv": 15000.0,
    "ltv_cac_ratio": 6.0,
    "capital_efficiency_status": "healthy"
  },

  "team_information": {
    "founders": [
      { "name": "Alex Rivera", "role": "CEO", "domain_background": "Ex-Google", "is_technical": false },
      { "name": "Dr. Elena Vance", "role": "CTO", "domain_background": "PhD Systems", "is_technical": true }
    ],
    "team_size_estimate": 2,
    "technical_founder_present": true,
    "team_strengths": ["Technical Leadership"]
  },

  "traction_information": {
    "qualitative_traction": ["Over 50 enterprise pilots launched in Q2"],
    "public_metrics": {}
  },

  "market_information": {
    "tam_usd": 18000000000.0,
    "sam_usd": 5000000000.0,
    "som_usd": 1000000000.0,
    "cagr_percentage": 21.5,
    "market_drivers": ["Cloud adoption"],
    "market_headwinds": ["Vendor consolidation"],
    "sizing_confidence": 0.85
  },

  "technical_information": {
    "repository_full_name": "cloudmatrix/core",
    "tech_stack_standardized": ["FastAPI", "PostgreSQL", "Docker", "React"],
    "code_maturity_rating": "high",
    "supported_feature_claims": ["Distributed API gateway", "Microservices mesh"],
    "inferred_feature_claims": [],
    "unsupported_or_unknown_claims": [],
    "technical_strengths": ["Clean async Python", "PostgreSQL connection pooling"],
    "technical_risks": [],
    "files_audited_count": 18,
    "agent6_verified": true
  },

  "project_information": {
    "is_open_source": true,
    "problem_statement": "Unified multi-cloud API traffic monitoring",
    "primary_solution": "Distributed API gateway",
    "commercialization_readiness": "high"
  },

  "normalized_metrics": [
    {
      "metric_name": "annual_recurring_revenue",
      "original_value": "$2.4M",
      "normalized_value": 2400000.0,
      "unit": "USD",
      "currency": "USD",
      "confidence": 0.90,
      "validation_status": "valid",
      "source_agent": "agent1"
    }
  ],

  "validation_results": [],
  "duplicate_records": [
    {
      "field": "competitors",
      "duplicate_value": "kong",
      "kept_value": "Kong",
      "source_agents": ["agent1"],
      "similarity_score": 1.0,
      "action": "consolidated"
    }
  ],
  "conflicts": [],
  "missing_fields": [],
  "source_provenance": [
    {
      "field_path": "financial_information.annual_recurring_revenue",
      "source_agent": "agent1",
      "evidence_snippet": "$2.4M",
      "confidence_score": 0.85,
      "extraction_timestamp": "2026-10-01T12:00:00Z"
    }
  ]
}
```

---

## 📊 Mapping Agent 2 Data to Agent 3 Scoring Pillars

| Agent 3 Scoring Pillar | Agent 2 Fields Consumed | Key Decision Drivers |
| :--- | :--- | :--- |
| **1. Team & Founders** | `team_information.founders`, `technical_founder_present`, `team_strengths` | Evaluates domain experience, technical co-founder coverage, founder stability. |
| **2. Technical & Architecture** | `technical_information`, `project_information` | Code maturity rating (`high`/`moderate`), AST verified features vs unverified claims. |
| **3. Market Sizing & Opportunity** | `market_information`, `business_information.competitors` | Quantified TAM/SAM/SOM (in USD), CAGR growth, market headwinds vs drivers. |
| **4. Financials & Unit Economics** | `financial_information` | ARR, LTV/CAC ratio, monthly burn rate, runway months, capital efficiency status. |
| **5. Product & Business Model** | `business_information`, `project_information` | Business model classification, target segments, commercialization readiness. |
| **6. Moat & Defensibility** | `business_information.key_differentiators`, `conflicts` | Proprietary code verification, competitive clustering, contradiction flags. |

---

## 🛡️ Reliability Guarantees for Agent 3
1. **Never Invented Metrics**: If a numeric value (ARR, Burn, Runway) was not present in the pitch deck or verified sources, it is strictly `null` (not fabricated).
2. **Standardized Currency**: All monetary fields are converted to **USD** float values for direct mathematical comparison.
3. **Audited Provenance**: Every metric links back to its originating agent and evidence snippet via `source_provenance`.

