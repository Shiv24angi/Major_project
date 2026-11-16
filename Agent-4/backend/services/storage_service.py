"""Local Storage Service for Agent 4 Recommendations.

Stores results in:
- `storage/recommendations/latest.json`
- `storage/recommendations/latest_{analysis_id}.json`
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict

logger = logging.getLogger("agent4.storage")

STORAGE_DIR = Path(__file__).resolve().parent.parent / "storage" / "recommendations"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def save_recommendation_locally(result: Dict[str, Any]) -> str:
    """Writes recommendation result to local storage files."""
    try:
        rec_id = result.get("id", "rec_output")
        analysis_id = result.get("analysis_id", "default")

        # 1. By ID
        id_path = STORAGE_DIR / f"{rec_id}.json"
        with open(id_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

        # 2. By Analysis ID
        analysis_path = STORAGE_DIR / f"latest_{analysis_id}.json"
        with open(analysis_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

        # 3. Global latest
        latest_path = STORAGE_DIR / "latest.json"
        with open(latest_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

        logger.info(f"Saved local recommendation records to {STORAGE_DIR}")
        return str(id_path)
    except Exception as e:
        logger.error(f"Failed to persist recommendation locally: {e}")
        return ""
