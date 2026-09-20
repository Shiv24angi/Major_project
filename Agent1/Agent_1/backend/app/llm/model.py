import os

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI


load_dotenv()


def get_llm():
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY or GOOGLE_API_KEY is missing from .env"
        )

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # Override deprecated Google models (gemini-1.5 and gemini-2.0 return 404)
    if not model_name or "1.5" in model_name or "2.0" in model_name:
        model_name = "gemini-2.5-flash"

    primary_llm = ChatGoogleGenerativeAI(
        model=model_name,
        temperature=0,
        google_api_key=api_key
    )

    fallback_models = ["gemini-3.5-flash", "gemini-flash-latest"]
    fallbacks = [
        ChatGoogleGenerativeAI(
            model=m,
            temperature=0,
            google_api_key=api_key
        )
        for m in fallback_models
        if m != model_name
    ]

    return primary_llm.with_fallbacks(fallbacks)