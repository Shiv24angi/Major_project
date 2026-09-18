from app.graph.workflow import agent1_graph


def analyze_document(file_path: str) -> dict:
    initial_state = {
        "file_path": file_path,
        "document_type": None,
        "document_text": None,
        "metadata": None,
        "extracted_data": None,
        "validation_errors": [],
        "retry_count": 0,
        "status": "started",
    }

    result = agent1_graph.invoke(initial_state)

    return {
        "status": result.get("status"),
        "document_type": result.get("document_type"),
        "metadata": result.get("metadata"),
        "analysis": result.get("extracted_data"),
        "validation_errors": result.get("validation_errors"),
        "retry_count": result.get("retry_count"),
    }