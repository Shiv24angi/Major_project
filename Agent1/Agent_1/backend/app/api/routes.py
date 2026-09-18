from pathlib import Path
from typing import Annotated
import uuid

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
)

from app.services.document_service import extract_document_text
from app.services.analysis_service import analyze_document
from app.parsers.pdf_parser import extract_pdf_text
from app.graph.multi_workflow import multi_document_graph


router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".pptx", ".docx"}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...)
):
    filename = file.filename or "uploaded_file"
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, PPTX and DOCX files are allowed"
        )

    unique_filename = f"{uuid.uuid4()}{extension}"
    file_path = UPLOAD_DIR / unique_filename

    content = await file.read()

    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "message": "File uploaded successfully",
        "original_filename": filename,
        "stored_filename": unique_filename,
        "file_path": str(file_path),
        "file_type": extension
    }


@router.post("/extract-pdf")
async def extract_pdf(
    file: UploadFile = File(...)
):
    filename = file.filename or "uploaded_file"
    extension = Path(filename).suffix.lower()

    if extension != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported on this endpoint"
        )

    unique_filename = f"{uuid.uuid4()}.pdf"
    file_path = UPLOAD_DIR / unique_filename

    content = await file.read()

    with open(file_path, "wb") as f:
        f.write(content)

    try:
        result = extract_pdf_text(
            str(file_path)
        )

        return {
            "message": "PDF text extracted successfully",
            "original_filename": filename,
            "page_count": result["page_count"],
            "pages": result["pages"],
            "full_text": result["full_text"]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract PDF text: {str(e)}"
        )


@router.post("/extract-document")
async def extract_document(
    file: UploadFile = File(...)
):
    filename = file.filename or "uploaded_file"
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, PPTX and DOCX files are allowed"
        )

    unique_filename = f"{uuid.uuid4()}{extension}"
    file_path = UPLOAD_DIR / unique_filename

    content = await file.read()

    with open(file_path, "wb") as f:
        f.write(content)

    try:
        result = extract_document_text(
            str(file_path)
        )

        return {
            "message": "Document extracted successfully",
            "original_filename": filename,
            "document_type": result["document_type"],
            "full_text": result["full_text"],
            "metadata": result["metadata"]
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Document extraction failed: {str(e)}"
        )


@router.post("/analyze-document")
async def analyze_uploaded_document(
    file: UploadFile = File(...)
):
    filename = file.filename or "uploaded_file"
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, PPTX and DOCX files are allowed"
        )

    unique_filename = f"{uuid.uuid4()}{extension}"
    file_path = UPLOAD_DIR / unique_filename

    content = await file.read()

    with open(file_path, "wb") as f:
        f.write(content)

    try:
        result = analyze_document(
            str(file_path)
        )

        return {
            "message": "Document analyzed successfully",
            "original_filename": filename,
            "result": result
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/analyze-documents")
async def analyze_uploaded_documents(
    files: Annotated[
        list[UploadFile],
        File(
            description="Upload multiple PDF, PPTX, or DOCX files"
        )
    ]
):
    if not files:
        raise HTTPException(
            status_code=400,
            detail="Please upload at least one file"
        )

    file_paths = []
    uploaded_files = []

    for file in files:
        filename = file.filename or "uploaded_file"
        extension = Path(filename).suffix.lower()

        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported file type for {filename}. "
                    "Only PDF, PPTX and DOCX files are allowed."
                )
            )

        unique_filename = f"{uuid.uuid4()}{extension}"
        file_path = UPLOAD_DIR / unique_filename

        content = await file.read()

        with open(file_path, "wb") as f:
            f.write(content)

        file_paths.append(
            str(file_path)
        )

        uploaded_files.append(
            {
                "original_filename": filename,
                "stored_filename": unique_filename,
                "file_type": extension
            }
        )

    initial_state = {
        "file_paths": file_paths,

        "documents": [],
        "document_analyses": [],

        "merged_analysis": None,
        "contradictions": [],

        "validation_errors": [],
        "retry_count": 0,

        "status": "started"
    }

    try:
        result = multi_document_graph.invoke(
            initial_state
        )

        return {
            "message": "Documents analyzed successfully",

            "uploaded_files": uploaded_files,

            "status": result.get(
                "status"
            ),

            "document_analyses": result.get(
                "document_analyses",
                []
            ),

            "merged_analysis": result.get(
                "merged_analysis"
            ),

            "contradictions": result.get(
                "contradictions",
                []
            ),

            "validation_errors": result.get(
                "validation_errors",
                []
            )
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Multi-document analysis failed: {str(e)}"
            )
        )