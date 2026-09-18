
import os
import re
import pymupdf


def _transcribe_pdf_with_gemini(file_path: str, page_count: int) -> dict:
    """
    Fallback for scanned PDFs or presentations where slides are images.
    Uses Gemini's native multimodal capabilities to transcribe slide content.
    """
    try:
        from google import genai
        from google.genai import types

        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return {"page_count": page_count, "pages": [], "full_text": ""}

        client = genai.Client(api_key=api_key)
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

        with open(file_path, "rb") as f:
            pdf_bytes = f.read()

        prompt = (
            "You are an OCR and presentation transcription engine for startup pitch decks. "
            "Transcribe all text, financial metrics, numbers, titles, bullet points, founder names, "
            "market stats, and tables verbatim. "
            "Structure your output cleanly by inserting '--- PAGE X ---' headers before each page "
            "(e.g. '--- PAGE 1 ---', '--- PAGE 2 ---') to preserve precise slide references."
        )

        response = client.models.generate_content(
            model=model_name,
            contents=[
                types.Part.from_bytes(
                    data=pdf_bytes,
                    mime_type="application/pdf",
                ),
                prompt,
            ],
        )

        full_text = (response.text or "").strip()

        # Parse pages by --- PAGE X ---
        pages = []
        parts = re.split(r"--- PAGE (\d+) ---", full_text, flags=re.IGNORECASE)
        if len(parts) > 1:
            for i in range(1, len(parts), 2):
                pg_num = int(parts[i])
                pg_text = parts[i + 1].strip()
                pages.append({"page_number": pg_num, "text": pg_text})
        else:
            for p in range(1, page_count + 1):
                pages.append({"page_number": p, "text": ""})

        return {
            "page_count": page_count,
            "pages": pages,
            "full_text": full_text,
        }
    except Exception as e:
        print(f"[PDF Parser] Gemini visual transcription fallback error: {e}")
        return {"page_count": page_count, "pages": [], "full_text": ""}


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

    page_count = len(pages)
    document.close()

    extracted_text = "\n\n".join(full_text_parts).strip()

    # If the PDF has text, return immediately
    if len(extracted_text) >= 50:
        return {
            "page_count": page_count,
            "pages": pages,
            "full_text": extracted_text
        }

    # If text is empty or negligible (image slides / scanned pitch deck),
    # use Gemini multimodal transcription
    print(f"[PDF Parser] Minimal text ({len(extracted_text)} chars) found in {os.path.basename(file_path)}. Activating Gemini multimodal vision fallback...")
    gemini_result = _transcribe_pdf_with_gemini(file_path, page_count)
    if gemini_result.get("full_text"):
        return gemini_result

    # Fallback to whatever PyMuPDF extracted if Gemini fails
    return {
        "page_count": page_count,
        "pages": pages,
        "full_text": extracted_text
    }