from pathlib import Path

from app.parsers.pdf_parser import extract_pdf_text
from app.parsers.docx_parser import extract_docx_text
from app.parsers.pptx_parser import extract_pptx_text


def extract_document_text(file_path: str) -> dict:
    extension = Path(file_path).suffix.lower()

    if extension == ".pdf":
        result = extract_pdf_text(file_path)

        return {
            "document_type": "pdf",
            "full_text": result["full_text"],
            "metadata": {
                "page_count": result["page_count"],
                "pages": result["pages"]
            }
        }

    elif extension == ".docx":
        result = extract_docx_text(file_path)

        return {
            "document_type": "docx",
            "full_text": result["full_text"],
            "metadata": {
                "paragraph_count": result["paragraph_count"],
                "paragraphs": result["paragraphs"]
            }
        }

    elif extension == ".pptx":
        result = extract_pptx_text(file_path)

        return {
            "document_type": "pptx",
            "full_text": result["full_text"],
            "metadata": {
                "slide_count": result["slide_count"],
                "slides": result["slides"]
            }
        }

    else:
        raise ValueError(
            f"Unsupported document type: {extension}"
        )