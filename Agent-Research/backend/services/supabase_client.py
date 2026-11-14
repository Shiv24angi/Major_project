import logging
import os
from typing import Any, Dict, Optional
import httpx

logger = logging.getLogger("services.supabase")


class SupabaseStorageClient:
    """
    Direct REST storage client for Supabase PostgreSQL tables.
    Works natively via PostgREST with zero additional dependencies.
    """

    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY", "")

    def is_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_key and "your_" not in self.supabase_key)

    async def save_research_evaluation(self, record: Dict[str, Any]) -> bool:
        """Insert or upsert an external research evaluation record into public.research_evaluations."""
        if not self.is_configured():
            logger.info("Supabase credentials not configured. Skipping remote persistence.")
            return False

        table_url = f"{self.supabase_url}/rest/v1/research_evaluations"
        headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(table_url, headers=headers, json=record)
                if resp.status_code in (200, 201, 204):
                    logger.info(f"Successfully saved research evaluation {record.get('id')} to Supabase.")
                    return True
                else:
                    logger.warning(f"Supabase returned status {resp.status_code}: {resp.text}")
                    return False
        except Exception as e:
            logger.warning(f"Failed to persist research evaluation to Supabase: {e}")
            return False


# Global singleton instance
supabase_client = SupabaseStorageClient()

