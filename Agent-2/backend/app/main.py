"""Agent 2: Data Extraction & Normalization Service.

FastAPI Application running on port 8003.
Harmonizes and standardizes structured intelligence from Agent 1 (Pitch Decks),
Agent 6 (Codebase & Repositories), and External Research into unified evaluation
datasets for Agent 3 (Scoring Engine).
"""

import logging
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure Agent-2 directory is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Load .env file
load_dotenv(dotenv_path=BASE_DIR / ".env")
# Also check workspace root .env if present
WORKSPACE_ROOT = BASE_DIR.parent
if (WORKSPACE_ROOT / ".env").exists():
    load_dotenv(dotenv_path=WORKSPACE_ROOT / ".env")

from backend.app.api.routes import router as agent2_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("agent2.main")

app = FastAPI(
    title="VentureLens Agent 2: Data Extraction & Normalization",
    description=(
        "Standardizes, validates, deduplicates, and resolves conflicts across Agent 1, "
        "Agent 6, and External Research into unified datasets for Agent 3."
    ),
    version="1.0.0",
)

# Enable CORS for frontend and inter-agent communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(agent2_router, prefix="/api/v1/agent2", tags=["Agent 2: Normalization"])


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for container probes and load balancers."""
    from backend.services.supabase_client import supabase_client

    return {
        "status": "healthy",
        "service": "agent-2-data-normalization",
        "version": "1.0.0",
        "port": int(os.getenv("PORT", 8003)),
        "supabase_configured": supabase_client.is_configured(),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
    }


@app.on_event("startup")
async def on_startup():
    print("""
========================================================================
  VENTURELENS AGENT 2: DATA EXTRACTION & NORMALIZATION LOADED
  - Port: 8003
  - Ingestion: Agent 1 (Pitch Decks) + Agent 6 (Code AST) + External Research
  - Consumed By: Agent 3 (Startup Scoring Engine)
========================================================================
""")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8003))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

