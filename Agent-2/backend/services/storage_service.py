"""Local JSON Storage Service for Agent 2.

Persists normalized startup evaluation datasets locally for offline resilience,
testing, and fast local access. Mirrors the storage design of Agent 6.
"""

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("agent2.storage")

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage" / "normalized_outputs"


class StorageService:
    def __init__(self, storage_dir: Optional[Path] = None):
        self.storage_dir = storage_dir or STORAGE_DIR
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.index_file = self.storage_dir / "index.json"
        self._init_index()

    def _init_index(self):
        if not self.index_file.exists():
            with open(self.index_file, "w", encoding="utf-8") as f:
                json.dump({"runs": []}, f, indent=2)

    def save_normalized_output(self, analysis_id: str, data: Dict[str, Any]) -> str:
        """Save normalized profile JSON and update indices."""
        now_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        safe_id = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in analysis_id)
        filename = f"{safe_id}_{now_str}.json"
        filepath = self.storage_dir / filename

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)

        # Update latest pointer for this analysis_id
        latest_analysis_file = self.storage_dir / f"latest_{safe_id}.json"
        with open(latest_analysis_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)

        # Update global latest pointer
        global_latest = self.storage_dir / "latest.json"
        with open(global_latest, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)

        # Update index registry
        try:
            with open(self.index_file, "r", encoding="utf-8") as f:
                index_data = json.load(f)
            runs = index_data.get("runs", [])
            runs.insert(
                0,
                {
                    "analysis_id": analysis_id,
                    "filename": filename,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "startup_name": data.get("startup_profile", {}).get("canonical_name", "Unknown"),
                    "confidence_score": data.get("overall_confidence_score", 0.0),
                },
            )
            # Keep index bounded to recent 200 runs
            index_data["runs"] = runs[:200]
            with open(self.index_file, "w", encoding="utf-8") as f:
                json.dump(index_data, f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to update storage index: {e}")

        logger.info(f"Persisted normalized profile to {filepath}")
        return str(filepath)

    def get_by_analysis_id(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve most recent normalized profile for a given analysis_id."""
        safe_id = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in analysis_id)
        latest_file = self.storage_dir / f"latest_{safe_id}.json"
        if latest_file.exists():
            with open(latest_file, "r", encoding="utf-8") as f:
                return json.load(f)
        return None

    def get_latest(self) -> Optional[Dict[str, Any]]:
        """Retrieve global latest normalized profile."""
        latest_file = self.storage_dir / "latest.json"
        if latest_file.exists():
            with open(latest_file, "r", encoding="utf-8") as f:
                return json.load(f)
        return None

    def list_runs(self) -> List[Dict[str, Any]]:
        """List all indexed normalization runs."""
        if self.index_file.exists():
            with open(self.index_file, "r", encoding="utf-8") as f:
                return json.load(f).get("runs", [])
        return []


storage_service = StorageService()

