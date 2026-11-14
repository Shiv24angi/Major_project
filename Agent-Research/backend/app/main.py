import os
import sys
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Load .env file with fallback if python-dotenv is not installed
try:
    from dotenv import load_dotenv
    load_dotenv(backend_dir / ".env")
except ImportError:
    env_file = backend_dir / ".env"
    if env_file.exists():
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip().strip("'\""))

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as research_router

print("[AGENT-RESEARCH] NIVESH EXTERNAL RESEARCH ENGINE LOADED")

app = FastAPI(
    title="Nivesh External Research Engine API",
    description="VentureLens / Nivesh Tasks 5–9: Web Crawler, Market Research, Competitors & Diligence Engine",
    version="1.0.0",
)

# Allow requests from frontend dev servers (Major_frontend on port 5173/3000) and sibling agents
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    research_router,
    prefix="/research",
    tags=["External Research"]
)


@app.get("/")
def home():
    return {
        "service": "Nivesh External Research Engine",
        "status": "online",
        "port": int(os.getenv("PORT", 8002)),
        "tasks_supported": [
            "Task 5: Web crawler & extraction module",
            "Task 6: Market and industry research",
            "Task 7: Competitor research",
            "Task 8: Financial and funding research",
            "Task 9: News and sector developments",
        ],
        "docs_url": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8002))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
