"""Agent 4: Insight & Recommendation Generator Server.

FastAPI backend running on port 8005.
"""

import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

from app.api.routes import router as agent4_router

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("agent4.main")

app = FastAPI(
    title="VentureLens Agent 4 - Insight & Recommendation Generator",
    description="LLM + Business Rules Engine for Investment Thesis, Key Insights, and Diligence Questions (Port 8005)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agent4_router)


@app.get("/health")
async def root_health():
    return {
        "status": "online",
        "agent": "Agent 4 - Insight & Recommendation Generator",
        "port": 8005,
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8005"))
    logger.info(f"Starting Agent 4 (Insight & Recommendation Generator) on http://0.0.0.0:{port}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
