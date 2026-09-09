from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.github import router as github_router
from services.llm_service import ask_llm

print("🚀 MAIN.PY LOADED")

app = FastAPI(title="VentureLens Agent 6 API")

# Allow requests from frontend dev servers and local origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    github_router,
    prefix="/agent6/github",
    tags=["GitHub"]
)

@app.get("/")
def home():
    return {"message": "Backend Running"}

@app.get("/test-ai")
def test_ai():

    answer = ask_llm(
        "Explain React in one paragraph."
    )

    return {
        "answer": answer
    }