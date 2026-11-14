"""LLM Semantic Harmonizer for Agent 2.

Uses Google Gemini for qualitative disambiguation, terminology harmonization,
and reconciling subtle narrative contradictions. Provides robust rule-based
fallback when offline or when GEMINI_API_KEY is not configured.
"""

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("agent2.llm_harmonizer")

FALLBACK_MODELS = list(
    dict.fromkeys(
        [
            os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            "gemini-2.5-flash",
            "gemini-3.5-flash",
        ]
    )
)


class LLMHarmonizer:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "").strip()

    def _strip_markdown_json(self, text: str) -> str:
        """Strip markdown code fences and isolate the JSON object/array."""
        if not text:
            return ""
        cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            return cleaned[start : end + 1].strip()
        return cleaned.strip()

    async def call_gemini(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """Execute Gemini call via REST endpoint."""
        if not self.api_key:
            return None

        for model in FALLBACK_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            contents = []
            if system_prompt:
                contents.append({"role": "user", "parts": [{"text": f"System Instructions: {system_prompt}"}]})
                contents.append({"role": "model", "parts": [{"text": "Understood. I will follow these instructions."}]})
            contents.append({"role": "user", "parts": [{"text": prompt}]})

            payload = {
                "contents": contents,
                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1024},
            }

            try:
                # Fast connect timeout to avoid blocking offline/sandboxed environments
                timeout = httpx.Timeout(4.0, connect=1.5)
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                return parts[0].get("text", "")
            except (httpx.ConnectError, httpx.ConnectTimeout) as e:
                logger.debug(f"Network unavailable for Gemini ({e}). Falling back immediately.")
                break
            except Exception as e:
                logger.debug(f"Gemini call failed for {model}: {e}")
                continue

        return None

    async def harmonize_company_profile(
        self,
        name: str,
        deck_description: Optional[str],
        repo_problem: Optional[str],
        repo_solution: Optional[str],
        industry_raw: Optional[str],
    ) -> Dict[str, Any]:
        """Synthesize unified canonical description, standardized industry, and problem-solution alignment."""
        # Rule-based default
        desc_parts = [p for p in [deck_description, repo_problem, repo_solution] if p]
        canonical_desc = " | ".join(desc_parts) if desc_parts else f"{name} technology platform"

        fallback_result = {
            "canonical_description": canonical_desc,
            "primary_industry": industry_raw or "B2B Software",
            "business_model": "B2B SaaS / Enterprise Subscription",
            "confidence": 0.82,
        }

        if not self.api_key:
            return fallback_result

        prompt = f"""
You are an expert venture capital analyst normalizer. Unify the following raw inputs for startup '{name}':
- Pitch Deck Description: {deck_description or 'N/A'}
- Codebase Problem Statement: {repo_problem or 'N/A'}
- Codebase Solution: {repo_solution or 'N/A'}
- Raw Industry: {industry_raw or 'N/A'}

Respond ONLY with a JSON object:
{{
  "canonical_description": "Clean, professional 1-2 sentence executive summary",
  "primary_industry": "Standardized industry name (e.g. FinTech, B2B SaaS, HealthTech, Artificial Intelligence, Developer Tools, ClimateTech)",
  "business_model": "Standardized model (e.g. B2B SaaS, Marketplace, Usage-based API, Enterprise Licensing)",
  "confidence": 0.90
}}
"""
        try:
            resp_text = await self.call_gemini(prompt)
            if resp_text:
                cleaned = self._strip_markdown_json(resp_text)
                parsed = json.loads(cleaned)
                return {
                    "canonical_description": parsed.get("canonical_description", fallback_result["canonical_description"]),
                    "primary_industry": parsed.get("primary_industry", fallback_result["primary_industry"]),
                    "business_model": parsed.get("business_model", fallback_result["business_model"]),
                    "confidence": float(parsed.get("confidence", 0.88)),
                }
        except Exception as e:
            logger.debug(f"LLM harmonization parse error: {e}")

        return fallback_result
