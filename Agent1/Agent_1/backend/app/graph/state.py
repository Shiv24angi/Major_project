from typing import TypedDict, Optional, Any


class AgentState(TypedDict):
    file_path: str

    document_type: Optional[str]

    document_text: Optional[str]

    metadata: Optional[dict[str, Any]]
from typing import TypedDict, Optional, Any


class AgentState(TypedDict, total=False):
    # -------------------------
    # Input
    # -------------------------

    # Single-document mode
    file_path: Optional[str]

    # Multi-document mode
    file_paths: list[str]

    # -------------------------
    # Single document data
    # -------------------------

    document_type: Optional[str]
    document_text: Optional[str]
    metadata: Optional[dict[str, Any]]

    # -------------------------
    # Multi-document data
    # -------------------------

    documents: list[dict[str, Any]]

    document_analyses: list[dict[str, Any]]

    # -------------------------
    # Final / merged analysis
    # -------------------------

    extracted_data: Optional[dict[str, Any]]

    merged_analysis: Optional[dict[str, Any]]

    contradictions: list[dict[str, Any]]

    # -------------------------
    # Workflow control
    # -------------------------

    validation_errors: list[str]

    retry_count: int

    status: str
    extracted_data: Optional[dict[str, Any]]

    validation_errors: list[str]

    retry_count: int

    status: str