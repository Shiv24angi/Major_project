from fastapi import FastAPI
from routes.github import router as github_router
from services.llm_service import ask_llm

print("🚀 MAIN.PY LOADED")

app = FastAPI()

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