
import os
import re
import base64
import json
import urllib.request
import urllib.error
import pymupdf


def _get_fallback_models():
    configured = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    candidates = [
        configured,
        "gemini-2.5-flash",
        "gemini-3.5-flash",
        "gemini-flash-latest",
        "gemini-2.5-pro",
    ]
    seen = set()
    result = []
    for m in candidates:
        if m and m not in seen and m != "gemini-1.5-flash":
            seen.add(m)
            result.append(m)
    return result


def _transcribe_pdf_with_gemini(file_path: str, page_count: int) -> dict:
    """
    Fallback for scanned PDFs or presentations where slides are images.
    Uses Gemini's native multimodal capabilities to transcribe slide content.
    Includes automatic multi-model fallback and standard-library REST fallback
    to ensure it never fails due to missing pip packages or transient 503 errors.
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("[PDF Parser] No GEMINI_API_KEY or GOOGLE_API_KEY found.")
        return {"page_count": page_count, "pages": [], "full_text": ""}

    try:
        with open(file_path, "rb") as f:
            pdf_bytes = f.read()
    except Exception as e:
        print(f"[PDF Parser] Error reading file {file_path}: {e}")
        return {"page_count": page_count, "pages": [], "full_text": ""}

    prompt = (
        "You are an OCR and presentation transcription engine for startup pitch decks. "
        "Transcribe all text, financial metrics, numbers, titles, bullet points, founder names, "
        "market stats, and tables verbatim. "
        "Structure your output cleanly by inserting '--- PAGE X ---' headers before each page "
        "(e.g. '--- PAGE 1 ---', '--- PAGE 2 ---') to preserve precise slide references."
    )

    models_to_try = _get_fallback_models()
    full_text = ""

    # Strategy 1: google.genai SDK (if installed)
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)

        for model in models_to_try:
            try:
                print(f"[PDF Parser] Trying google-genai SDK with {model}...")
                resp = client.models.generate_content(
                    model=model,
                    contents=[
                        types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
                        prompt,
                    ],
                )
                if resp and resp.text and resp.text.strip():
                    full_text = resp.text.strip()
                    print(f"[PDF Parser] google-genai succeeded with {model} ({len(full_text)} chars)")
                    break
            except Exception as e:
                print(f"[PDF Parser] google-genai {model} error: {e}")
    except ImportError:
        print("[PDF Parser] google-genai not installed, moving to direct REST fallback...")
    except Exception as e:
        print(f"[PDF Parser] google-genai setup error: {e}")

    # Strategy 2: Direct REST API via standard library urllib (zero dependencies, 100% portable)
    if not full_text:
        try:
            encoded_data = base64.b64encode(pdf_bytes).decode("utf-8")
            for model in models_to_try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {"inlineData": {"mimeType": "application/pdf", "data": encoded_data}},
                                {"text": prompt},
                            ]
                        }
                    ]
                }
                try:
                    print(f"[PDF Parser] Trying direct REST API fallback with {model}...")
                    req = urllib.request.Request(
                        url,
                        data=json.dumps(payload).encode("utf-8"),
                        headers={"Content-Type": "application/json"},
                    )
                    with urllib.request.urlopen(req, timeout=90) as response:
                        data = json.loads(response.read().decode("utf-8"))
                        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if text and text.strip():
                            full_text = text.strip()
                            print(f"[PDF Parser] REST fallback succeeded with {model} ({len(full_text)} chars)")
                            break
                except urllib.error.HTTPError as e:
                    err_body = e.read().decode("utf-8", errors="replace")[:150]
                    print(f"[PDF Parser] REST HTTP {e.code} on {model}: {err_body}")
                except Exception as e:
                    print(f"[PDF Parser] REST error on {model}: {e}")
        except Exception as e:
            print(f"[PDF Parser] REST fallback preparation error: {e}")

    if not full_text:
        print(f"[PDF Parser] Failed to transcribe {os.path.basename(file_path)} with all models.")
        return {"page_count": page_count, "pages": [], "full_text": ""}

    # Parse pages by --- PAGE X ---
    pages = []
    parts = re.split(r"--- PAGE (\d+) ---", full_text, flags=re.IGNORECASE)
    if len(parts) > 1:
        for i in range(1, len(parts), 2):
            pg_num = int(parts[i])
            pg_text = parts[i + 1].strip()
            pages.append({"page_number": pg_num, "text": pg_text})
    else:
        pages.append({"page_number": 1, "text": full_text})

    return {
        "page_count": max(page_count, len(pages)),
        "pages": pages,
        "full_text": full_text,
    }


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