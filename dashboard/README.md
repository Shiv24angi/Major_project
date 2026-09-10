# VenturePulse AI - Startup Evaluation Platform Dashboard

A comprehensive, interactive web dashboard showcasing all features of the **AI Startup Evaluation Platform** from the system design architecture.

---

## 🌟 Features Displayed

1. **Multi-Agent Pipeline Monitor**:
   - **Layer 0 (Preprocessing)**: PDF/OCR, Email parsing, AST Code chunking.
   - **Agent 1 (Document Analysis)**: Pitch deck, financials, team, TAM/SAM/SOM extraction.
   - **Agent 6 (Project → Startup Code LLM)**: Code RAG, architecture, tech stack, evidence validation.
   - **Agent 2 (Normalization & Bridge)**: Deduplication and unified startup schema.
   - **Agent 3 (Scoring Engine)**: 6-dimensional quant model (Market, Tech, Team, Financials, Traction, Risk).
   - **Agent 4 (Insight & Thesis)**: Bull/Bear thesis, risk mitigations, [INVEST / MONITOR / PASS] decision.
   - **Agent 5 (Report Studio)**: Exportable Executive PDF, Pitch Deck PPT, Excel Model, Shareable link.

2. **Dual Mode Selector**:
   - **Mode A (Startup Evaluation)**: Pitch deck (PDF/PPT), Financials, Founder updates, Gmail connector.
   - **Mode B (Project → Startup)**: GitHub repo URL, AST chunking, Code quality & technical signals.

3. **Multi-Startup Switcher**:
   - **EcoVerse** (ClimateTech / Mode B / Seed - 88 Score - INVEST)
   - **FinAI Sentinel** (FinTech / Hybrid / Series A - 93 Score - INVEST Top 1%)
   - **BioSynth AI** (BioTech / Mode A / Pre-Seed - 76 Score - MONITOR)

4. **Agent 6 ➔ Agent 2 Live Storage Handoff Bridge**:
   - View, copy, and inspect the exact JSON payload stored for Agent 2.
   - One-click sync button with live backend endpoint (`http://localhost:8000/agent6/github/handoff/latest`).

---

## 🚀 How to Run the Dashboard

Simply open `dashboard/index.html` in any web browser!

Or serve with Python or any local web server:
```bash
# From the project root
python -m http.server 3000 --directory dashboard
```
Then visit `http://localhost:3000`.
