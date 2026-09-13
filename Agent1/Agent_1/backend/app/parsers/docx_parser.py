from docx import Document
from zipfile import BadZipFile


def extract_docx_text(file_path: str) -> dict:
    try:
        document = Document(file_path)

    except BadZipFile as e:
        raise ValueError(
            "The uploaded file is not a valid DOCX file."
        ) from e

    except KeyError as e:
        raise ValueError(
            "The DOCX file appears to be invalid or corrupted."
        ) from e

    except Exception as e:
        raise ValueError(
            f"Failed to open DOCX file: {str(e)}"
        ) from e

    paragraphs = []
    full_text_parts = []

    for paragraph_number, paragraph in enumerate(
        document.paragraphs,
        start=1
    ):
        text = paragraph.text.strip()

        if not text:
            continue

        paragraphs.append(
            {
                "paragraph_number": paragraph_number,
                "text": text
            }
        )

        # IMPORTANT:
        # Give the LLM an exact source marker.
        full_text_parts.append(
            f"--- PARAGRAPH {paragraph_number} ---\n{text}"
        )

    full_text = "\n\n".join(full_text_parts)

    return {
        "paragraph_count": len(paragraphs),
        "paragraphs": paragraphs,
        "full_text": full_text
    }