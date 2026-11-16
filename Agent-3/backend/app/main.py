"""Agent 3: Multi-Dimensional Startup Scoring Engine.

Entry point for FastAPI server running on port 8004.
"""

import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

from app.api.routes import router as agent3_router

load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("agent3.main")

app = FastAPI(
    title="VentureLens Agent 3 - Scoring Engine",
    description="Multi-Dimensional Startup Scoring & Risk Calibration Engine (Port 8004)",
    version="1.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(agent3_router)


@app.get("/health")
async def root_health():
    return {
        "status": "online",
        "agent": "Agent 3 - Scoring Engine",
        "port": 8004,
        "mode": "standalone_or_pipeline",
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8004"))
    logger.info(f"Starting Agent 3 (Scoring Engine) on http://0.0.0.0:{port}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
