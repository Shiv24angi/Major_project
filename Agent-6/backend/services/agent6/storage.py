import os
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional


class Agent6Storage:
    """
    Persistent storage and retrieval service for Agent 6 outputs.
    Enables Agent 2 (and subsequent downstream agents) to retrieve
    standardized, evidence-backed evaluation payloads.
    """

    def __init__(self, base_dir: Optional[str] = None):
        if base_dir is None:
            # Default to Agent-6/backend/storage/agent6_outputs/
            current_dir = os.path.dirname(os.path.abspath(__file__))
            backend_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
            self.storage_dir = os.path.join(backend_dir, "storage", "agent6_outputs")
        else:
            self.storage_dir = base_dir

        os.makedirs(self.storage_dir, exist_ok=True)
        self.index_file = os.path.join(self.storage_dir, "index.json")
        self._init_index()

    def _init_index(self):
        if not os.path.exists(self.index_file):
            with open(self.index_file, "w", encoding="utf-8") as f:
                json.dump({"runs": [], "latest_run_id": None}, f, indent=2)

    def _read_index(self) -> Dict[str, Any]:
        try:
            with open(self.index_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"runs": [], "latest_run_id": None}

    def _write_index(self, index_data: Dict[str, Any]):
        with open(self.index_file, "w", encoding="utf-8") as f:
            json.dump(index_data, f, indent=2)

    def save_agent6_output(
        self,
        repository: Dict[str, Any],
        findings: List[Dict[str, Any]],
        analysis_metadata: Dict[str, Any],
        raw_analysis: Optional[Dict[str, Any]] = None,
        github_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Saves a structured Agent 6 output payload ready for Agent 2 consumption.
        """
        owner = repository.get("owner", "unknown")
        repo_name = repository.get("name", "unknown")
        timestamp = datetime.utcnow().isoformat() + "Z"
        run_timestamp_slug = time.strftime("%Y%m%d_%H%M%S")
        run_id = f"{owner}_{repo_name}_{run_timestamp_slug}"

        # Standardized schema for Agent 2
        payload = {
            "version": "1.0",
            "run_id": run_id,
            "timestamp": timestamp,
            "source_agent": "agent_6_project_code",
            "target_agent": "agent_2_data_normalization",
            "github_url": github_url or f"https://github.com/{owner}/{repo_name}",
            "repository": {
                "owner": owner,
                "name": repo_name,
                "full_name": f"{owner}/{repo_name}"
            },
            "findings_summary": {
                "total_findings": len(findings),
                "supported_count": sum(1 for f in findings if f.get("status") == "supported"),
                "inferred_count": sum(1 for f in findings if f.get("status") == "inferred"),
                "unknown_count": sum(1 for f in findings if f.get("status") == "unknown")
            },
            "findings": findings,
            "raw_analysis": raw_analysis or {},
            "metadata": {
                **analysis_metadata,
                "saved_at": timestamp,
                "storage_type": "file_json"
            }
        }

        # 1. Save specific run file
        run_filename = f"{run_id}.json"
        run_filepath = os.path.join(self.storage_dir, run_filename)
        with open(run_filepath, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        # 2. Save latest for this repository
        repo_latest_filename = f"latest_{owner}_{repo_name}.json"
        repo_latest_path = os.path.join(self.storage_dir, repo_latest_filename)
        with open(repo_latest_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        # 3. Save global latest file
        global_latest_path = os.path.join(self.storage_dir, "latest.json")
        with open(global_latest_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        # 4. Update index
        index_data = self._read_index()
        run_entry = {
            "run_id": run_id,
            "filename": run_filename,
            "owner": owner,
            "repository": repo_name,
            "timestamp": timestamp,
            "total_findings": len(findings),
            "file_path": run_filepath
        }
        index_data["runs"].insert(0, run_entry)
        index_data["latest_run_id"] = run_id
        self._write_index(index_data)

        print(f"\n[Agent6Storage] Successfully saved output to:")
        print(f" -> Run Payload: {run_filepath}")
        print(f" -> Global Latest: {global_latest_path}")

        return {
            "run_id": run_id,
            "file_path": run_filepath,
            "global_latest_path": global_latest_path,
            "payload": payload
        }

    def get_latest(self, owner: Optional[str] = None, repo_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Retrieves the latest Agent 6 output for a repository or globally.
        Used by Agent 2 to pull the technical data.
        """
        if owner and repo_name:
            target_path = os.path.join(self.storage_dir, f"latest_{owner}_{repo_name}.json")
        else:
            target_path = os.path.join(self.storage_dir, "latest.json")

        if os.path.exists(target_path):
            with open(target_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return None

    def get_by_run_id(self, run_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a specific evaluation run by ID.
        """
        target_path = os.path.join(self.storage_dir, f"{run_id}.json")
        if os.path.exists(target_path):
            with open(target_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return None

    def list_runs(self) -> List[Dict[str, Any]]:
        """
        Lists all saved Agent 6 runs.
        """
        index_data = self._read_index()
        return index_data.get("runs", [])


# Global singleton instance for easy import across services and agents
storage = Agent6Storage()
