import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@patch("app.api.routes.multi_document_graph.invoke")
def test_multi_file_upload_success(mock_invoke):
    mock_invoke.return_value = {
        "status": "analyses_merged",
        "document_analyses": [
            {
                "filename": "test1.pdf",
                "analysis": {"is_startup_document": True}
            },
            {
                "filename": "test2.pptx",
                "analysis": {"is_startup_document": True}
            }
        ],
        "merged_analysis": {"company_name": "Test Startup"},
        "contradictions": [],
        "validation_errors": []
    }

    files = [
        (
            "files",
            (
                "pitch_deck.pdf",
                b"%PDF-1.4 test pitch deck content",
                "application/pdf"
            )
        ),
        (
            "files",
            (
                "presentation.pptx",
                b"PK test presentation content",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            )
        )
    ]

    response = client.post("/api/v1/analyze-documents", files=files)

    assert response.status_code == 200
    data = response.json()

    assert data["message"] == "Documents analyzed successfully"
    assert len(data["uploaded_files"]) == 2
    assert data["uploaded_files"][0]["original_filename"] == "pitch_deck.pdf"
    assert data["uploaded_files"][0]["file_type"] == ".pdf"
    assert data["uploaded_files"][1]["original_filename"] == "presentation.pptx"
    assert data["uploaded_files"][1]["file_type"] == ".pptx"
    assert data["status"] == "analyses_merged"
    assert data["merged_analysis"] == {"company_name": "Test Startup"}

    # Verify graph invoke was called with correct initial_state structure
    assert mock_invoke.call_count == 1
    call_args = mock_invoke.call_args[0][0]
    assert len(call_args["file_paths"]) == 2
    assert call_args["status"] == "started"


def test_multi_file_upload_invalid_extension():
    files = [
        (
            "files",
            (
                "unsupported.txt",
                b"plain text file",
                "text/plain"
            )
        )
    ]

    response = client.post("/api/v1/analyze-documents", files=files)

    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_existing_single_upload_endpoint():
    file_data = (
        "file",
        (
            "single.pdf",
            b"%PDF-1.4 single file test content",
            "application/pdf"
        )
    )

    response = client.post("/api/v1/upload", files=[file_data])

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "File uploaded successfully"
    assert data["original_filename"] == "single.pdf"
    assert data["file_type"] == ".pdf"
