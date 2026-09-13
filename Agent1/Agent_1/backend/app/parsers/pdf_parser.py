
import pymupdf

def extract_pdf_text(file_path: str) -> dict:
    document = pymupdf.open(file_path)

    pages = []
    full_text_parts = []

    for page_number, page in enumerate(
        document,
        start=1
    ):
        text = page.get_text("text").strip()

        pages.append(
            {
                "page_number": page_number,
                "text": text
            }
        )

        if text:
            full_text_parts.append(
                f"--- PAGE {page_number} ---\n{text}"
            )

    document.close()

    return {
        "page_count": len(pages),
        "pages": pages,
        "full_text": "\n\n".join(full_text_parts)
    }