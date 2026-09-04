from typing import Any, Dict, List
from typing_extensions import TypedDict


class Agent6State(TypedDict, total=False):

    # ============================================================
    # INPUT
    # ============================================================

    github_url: str

    # ============================================================
    # REPOSITORY
    # ============================================================

    repository: Dict[str, Any]

    # Example:
    # {
    #     "owner": "react",
    #     "name": "react"
    # }

    # ============================================================
    # REPOSITORY DISCOVERY
    # ============================================================

    readme: str

    files: List[Dict[str, Any]]

    # Example:
    # {
    #     "name": "package.json",
    #     "path": "package.json",
    #     "type": "file"
    # }

    # ============================================================
    # FILE SELECTION
    # ============================================================

    selected_files: List[str]

    # ============================================================
    # SOURCE CODE
    # ============================================================

    file_contents: Dict[str, str]

    # Example:
    # {
    #     "packages/react/src/React.js": "...source code..."
    # }

    # ============================================================
    # CODE CHUNKING
    # ============================================================

    chunks: List[Dict[str, Any]]

    # Example:
    # {
    #     "file_path": "...",
    #     "chunk_index": 0,
    #     "total_chunks": 3,
    #     "content": "..."
    # }

    # ============================================================
    # AGENT 6 ANALYSIS
    # ============================================================

    final_analysis: Dict[str, Any]

    findings: List[Dict[str, Any]]

    # ============================================================
    # AGENT 6 → AGENT 2 HANDOFF
    # ============================================================
    #
    # This is the important addition.
    #
    # Agent 6 produces a structured, evidence-backed payload
    # that the other person's Agent 2 can consume.
    #
    # We are NOT implementing Agent 2 here.
    # We are only making the handoff explicit.

    agent6_output: Dict[str, Any]

    # ============================================================
    # ANALYSIS METADATA
    # ============================================================

    analysis_metadata: Dict[str, Any]

    # Example:
    #
    # {
    #     "files_discovered": 5242,
    #     "files_selected": 15,
    #     "files_read": 15,
    #     "chunks_created": 15
    # }

    # ============================================================
    # ERROR HANDLING
    # ============================================================

    error: str

    raw_analysis: str