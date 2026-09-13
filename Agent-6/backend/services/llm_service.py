import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

# Models in order of preference (using available models with high token quotas)
FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-1.5-flash"
]


def ask_llm(prompt: str) -> str:
    """
    Call Gemini LLM with automatic model fallback for resilience against rate limits.
    """
    last_error = None

    for model_name in FALLBACK_MODELS:
        try:
            # First try generate_content standard endpoint
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            if response and response.text:
                return response.text
        except Exception as e:
            last_error = e
            print(f"[llm_service] Model {model_name} failed: {e}. Trying fallback...", flush=True)
            # Try interaction fallback
            try:
                interaction = client.interactions.create(
                    model=model_name,
                    input=prompt
                )
                if interaction and interaction.output_text:
                    return interaction.output_text
            except Exception as e2:
                last_error = e2
                continue

    # If all models fail, raise the last encountered error
    raise RuntimeError(f"All LLM models failed. Last error: {last_error}")