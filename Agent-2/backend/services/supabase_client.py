"""Supabase Storage and Integration Client for Agent 2.

Handles direct persistence and retrieval of normalized startup profiles
to/from Supabase via PostgREST with zero heavy ORM overhead.
"""

import logging
import os
from typing import Any, Dict, Optional, Tuple
import httpx

logger = logging.getLogger("agent2.supabase")


class SupabaseClient:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY", "") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    def is_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_key and "your_" not in self.supabase_key)

    def _headers(self, prefer_upsert: bool = False) -> Dict[str, str]:
        headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
        }
        if prefer_upsert:
            headers["Prefer"] = "resolution=merge-duplicates,return=representation"
        return headers

    async def save_normalized_profile(self, record: Dict[str, Any]) -> bool:
        """Persist or upsert normalized startup profile into public.normalized_startup_profiles."""
        if not self.is_configured():
            logger.info("Supabase credentials not configured. Skipping remote persistence.")
            return False

        table_url = f"{self.supabase_url}/rest/v1/normalized_startup_profiles"
        try:
            timeout = httpx.Timeout(4.0, connect=1.5)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(
                    table_url,
                    headers=self._headers(prefer_upsert=True),
                    json=record,
                )
                if resp.status_code in (200, 201, 204):
                    logger.info(f"Successfully persisted normalized profile {record.get('id')} to Supabase.")
                    return True
                else:
                    logger.warning(f"Supabase write returned {resp.status_code}: {resp.text}")
                    return False
        except (httpx.ConnectError, httpx.ConnectTimeout) as e:
            logger.debug(f"Supabase network unavailable ({e}). Skipping remote write.")
            return False
        except Exception as e:
            logger.warning(f"Error persisting normalized profile to Supabase: {e}")
            return False

    async def get_normalized_profile(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve normalized profile for an analysis_id."""
        if not self.is_configured():
            return None

        table_url = f"{self.supabase_url}/rest/v1/normalized_startup_profiles?analysis_id=eq.{analysis_id}&order=created_at.desc&limit=1"
        try:
            timeout = httpx.Timeout(4.0, connect=1.5)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.get(table_url, headers=self._headers())
                if resp.status_code == 200:
                    records = resp.json()
                    if records and len(records) > 0:
                        return records[0]
        except Exception as e:
            logger.warning(f"Error fetching normalized profile from Supabase: {e}")
        return None

    async def fetch_upstream_evaluations(self, analysis_id: str) -> Tuple[Optional[Dict], Optional[Dict]]:
        """Fetch existing Agent 1 document analysis and research evaluations from Supabase for this analysis_id."""
        if not self.is_configured() or analysis_id.startswith("test_"):
            return None, None

        agent1_data = None
        research_data = None

        try:
            timeout = httpx.Timeout(2.0, connect=0.4)
            async with httpx.AsyncClient(timeout=timeout) as client:
                # 1. Fetch Agent 1 evaluation
                url_a1 = f"{self.supabase_url}/rest/v1/evaluations?analysis_id=eq.{analysis_id}&order=created_at.desc&limit=1"
                resp_a1 = await client.get(url_a1, headers=self._headers())
                if resp_a1.status_code == 200:
                    res = resp_a1.json()
                    if res:
                        agent1_data = res[0]

                # 2. Fetch External Research evaluation
                url_res = f"{self.supabase_url}/rest/v1/research_evaluations?analysis_id=eq.{analysis_id}&order=created_at.desc&limit=1"
                resp_res = await client.get(url_res, headers=self._headers())
                if resp_res.status_code == 200:
                    res2 = resp_res.json()
                    if res2:
                        research_data = res2[0]
        except (httpx.ConnectError, httpx.ConnectTimeout):
            pass
        except Exception as e:
            logger.warning(f"Error fetching upstream evaluations from Supabase: {e}")

        return agent1_data, research_data


supabase_client = SupabaseClient()
