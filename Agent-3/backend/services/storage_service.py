"""Local Storage Service for Agent 3 Scoring Outputs.

Maintains durable local JSON records:
- `storage/scoring_outputs/latest.json`
- `storage/scoring_outputs/latest_{analysis_id}.json`
- `storage/scoring_outputs/{scoring_id}.json`
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict

logger = logging.getLogger("agent3.storage")

STORAGE_DIR = Path(__file__).resolve().parent.parent / "storage" / "scoring_outputs"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def save_scoring_result_locally(result: Dict[str, Any]) -> str:
    """Writes scoring result to storage files."""
    try:
        scoring_id = result.get("id", "scoring_output")
        analysis_id = result.get("analysis_id", "default")

        # 1. By ID
        id_path = STORAGE_DIR / f"{scoring_id}.json"
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

        logger.info(f"Saved local scoring records to {STORAGE_DIR}")
        return str(id_path)
    except Exception as e:
        logger.error(f"Failed to persist scoring result locally: {e}")
        return ""
