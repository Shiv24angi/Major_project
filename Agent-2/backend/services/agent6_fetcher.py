"""Agent 6 Data Fetcher for Agent 2.

Implements the access patterns described in Agent-6/backend/AGENT2_INTEGRATION_GUIDE.md:
1. Primary: REST API call to Agent 6 service (default port 8000).
2. Fallback: Direct local file read from Agent-6/backend/storage/agent6_outputs/latest.json.
"""

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional
import httpx

logger = logging.getLogger("agent2.agent6_fetcher")

AGENT6_API_BASE = os.getenv("AGENT6_API_BASE", "http://localhost:8000").rstrip("/")
WORKSPACE_DIR = Path(__file__).resolve().parent.parent.parent.parent
AGENT6_STORAGE_DIR = WORKSPACE_DIR / "Agent-6" / "backend" / "storage" / "agent6_outputs"


class Agent6Fetcher:
    def __init__(self, api_base: str = AGENT6_API_BASE, storage_dir: Path = AGENT6_STORAGE_DIR):
        self.api_base = api_base
        self.storage_dir = storage_dir

    async def fetch_latest(
        self,
        owner: Optional[str] = None,
        repo: Optional[str] = None,
        run_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Fetch Agent 6 evaluation via HTTP REST API with graceful filesystem fallback."""
        # 1. Try file fallback first if available on disk for instant zero-latency retrieval
        cached = self._read_from_filesystem(owner=owner, repo=repo, run_id=run_id)
        if cached:
            return cached

        # 2. Try HTTP API with fast connect timeout
        try:
            params = {}
            if run_id:
                endpoint = f"{self.api_base}/agent6/github/handoff/{run_id}"
            elif owner and repo:
                endpoint = f"{self.api_base}/agent6/github/handoff/latest"
                params = {"owner": owner, "repo": repo}
            else:
                endpoint = f"{self.api_base}/agent6/github/handoff/latest"

            timeout = httpx.Timeout(1.5, connect=0.4)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.get(endpoint, params=params)
                if resp.status_code == 200:
                    logger.info("Successfully fetched Agent 6 data via HTTP API.")
                    return resp.json()
        except Exception as e:
            logger.debug(f"Agent 6 HTTP fetch skipped or unavailable ({e}).")

        return None

    def _read_from_filesystem(
        self,
        owner: Optional[str] = None,
        repo: Optional[str] = None,
        run_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Read Agent 6 output JSON directly from disk."""
        if not self.storage_dir.exists():
            return None

        target_file: Optional[Path] = None

        if run_id:
            target_file = self.storage_dir / f"{run_id}.json"
        elif owner and repo:
            target_file = self.storage_dir / f"latest_{owner}_{repo}.json"

        if not target_file or not target_file.exists():
            target_file = self.storage_dir / "latest.json"

        if target_file and target_file.exists():
            try:
                with open(target_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    logger.info(f"Loaded Agent 6 output directly from {target_file}")
                    return data
            except Exception as e:
                logger.warning(f"Failed to read Agent 6 output from {target_file}: {e}")

        return None


agent6_fetcher = Agent6Fetcher()
