import json
import logging
import os
import re
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("services.llm")

FALLBACK_MODELS: List[str] = [
    os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-pro",
]


class LLMClient:
    """
    Resilient Google Gemini LLM Client.
    Supports both official google.genai SDK and direct httpx REST calls,
    with multi-model fallback and JSON response extraction.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "").strip()

    def _clean_json_markdown(self, raw_text: str) -> str:
        """Strip markdown ```json ... ``` code fences and extract valid json substring."""
        if not raw_text:
            return ""

        # Remove ```json ... ``` or ``` ... ```
        cleaned = re.sub(r"^```(?:json)?\s*", "", raw_text.strip(), flags=re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)

        # Find outer matching braces if extra text surrounds the JSON
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            cleaned = cleaned[start:end + 1]

        return cleaned.strip()

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Call Gemini LLM with automatic model fallback."""
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set. Using heuristic response.")
            return ""

        # Try google.genai SDK if available
        try:
            from google import genai
            client = genai.Client(api_key=self.api_key)
            for model in FALLBACK_MODELS:
                try:
                    full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
                    resp = client.models.generate_content(model=model, contents=full_prompt)
                    if resp and resp.text:
                        return resp.text
                except Exception as e:
                    logger.debug(f"SDK model {model} failed: {e}. Trying fallback...")
                    continue
        except ImportError:
            pass

        # Direct REST API fallback via httpx
        for model in FALLBACK_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            contents = []
            if system_prompt:
                contents.append({"role": "user", "parts": [{"text": f"SYSTEM: {system_prompt}"}]})
                contents.append({"role": "model", "parts": [{"text": "Understood. I will strictly follow the instructions."}]})
            contents.append({"role": "user", "parts": [{"text": prompt}]})

            payload = {
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 2048,
                }
            }

            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                return parts[0].get("text", "")
            except Exception as e:
                logger.debug(f"REST call for model {model} failed: {e}")
                # If network or DNS is unreachable, do not repeat failing connect loop on same host
                if isinstance(e, (httpx.ConnectError, httpx.NetworkError)) or "getaddrinfo" in str(e).lower():
                    logger.debug("Network unreachable. Bypassing remaining model retries.")
                    break
                continue

        return ""

    async def generate_structured_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Generate strict structured JSON output from Gemini, with fence stripping
        and JSON repair fallback.
        """
        json_instruction = (
            "You MUST respond ONLY with valid JSON. Do not include markdown codeblocks, explanations, or commentary."
        )
        effective_sys = f"{system_prompt}\n{json_instruction}" if system_prompt else json_instruction

        raw_resp = await self.generate_text(prompt=prompt, system_prompt=effective_sys)
        if not raw_resp:
            return None

        cleaned = self._clean_json_markdown(raw_resp)

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Fallback to json_repair if available
            try:
                import json_repair
                return json_repair.loads(cleaned)
            except Exception:
                logger.warning(f"Failed to parse LLM JSON output: {cleaned[:200]}")
                return None


# Global LLM client singleton
llm_client = LLMClient()

