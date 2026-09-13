from app.graph.state import AgentState
import re

from app.services.document_service import (
    extract_document_text
)

from app.chains.document_extraction import (
    get_document_extraction_chain
)


MAX_RETRIES = 2


def parse_document_node(state: AgentState):
    """
    Parse PDF / DOCX / PPTX and extract raw text.
    """

    file_path = state["file_path"]

    document = extract_document_text(
        file_path
    )

    document_text = document["full_text"]

    if not document_text.strip():
        return {
            "document_type": document["document_type"],
            "document_text": "",
            "metadata": document["metadata"],
            "validation_errors": [
                "No readable text could be extracted from the document"
            ],
            "status": "parse_failed"
        }

    return {
        "document_type": document["document_type"],
        "document_text": document_text,
        "metadata": document["metadata"],
        "status": "parsed"
    }


def extract_startup_data_node(state: AgentState):
    """
    Send extracted document text to LangChain + Gemini.
    """

    document_text = state.get(
        "document_text"
    )

    if not document_text:
        return {
            "validation_errors": [
                "Document text is empty"
            ],
            "status": "extraction_failed"
        }

    chain = get_document_extraction_chain()

    result = chain.invoke(
        {
            "document_text": document_text
        }
    )

    return {
        "extracted_data": result.model_dump(),
        "status": "extracted"
    }


def validate_evidence_locations(
    document_text: str,
    evidence_list: list
) -> list[str]:
    """
    Check whether evidence locations actually exist
    in the parsed document markers.
    """

    errors = []

    valid_locations = set()

    markers = re.findall(
        r"--- (PAGE|SLIDE|PARAGRAPH) (\d+) ---",
        document_text
    )

    for marker_type, number in markers:
        valid_locations.add(
            f"{marker_type} {number}"
        )

    for evidence in evidence_list:
        location = evidence.get("location")

        if not location:
            continue

        location = location.upper().strip()

        if location not in valid_locations:
            errors.append(
                f"Invalid evidence location: {location}"
            )

    # IMPORTANT: this must be INSIDE the function
    return errors


def validate_output_node(state: AgentState):
    """
    Business-level validation of LLM output.
    """

    extracted_data = state.get(
        "extracted_data"
    )

    errors = []

    if not extracted_data:
        return {
            "validation_errors": [
                "No startup data was extracted"
            ],
            "status": "invalid"
        }

    # ---------------------------------
    # Non-startup document
    # ---------------------------------

    is_startup = extracted_data.get(
        "is_startup_document",
        False
    )

    if not is_startup:
        return {
            "validation_errors": [],
            "status": "not_startup_document"
        }

    # ---------------------------------
    # Evidence validation
    # PASTE IT HERE
    # ---------------------------------

    document_text = state.get(
        "document_text",
        ""
    )

    evidence = extracted_data.get(
        "evidence",
        []
    )

    evidence_errors = validate_evidence_locations(
        document_text,
        evidence
    )

    errors.extend(
        evidence_errors
    )

    # ---------------------------------
    # Startup document validation
    # ---------------------------------

    meaningful_fields = [
        extracted_data.get(
            "startup_name"
        ),
        extracted_data.get(
            "description"
        ),
        extracted_data.get(
            "product"
        ),
        extracted_data.get(
            "business_model"
        ),
        extracted_data.get(
            "traction"
        ),
    ]

    if not any(
        meaningful_fields
    ):
        errors.append(
            "No meaningful startup information was found"
        )

    if "financials" not in extracted_data:
        errors.append(
            "Financial information structure is missing"
        )

    if "market_size" not in extracted_data:
        errors.append(
            "Market size structure is missing"
        )

    # ---------------------------------
    # Final validation result
    # ---------------------------------

    if errors:
        return {
            "validation_errors": errors,
            "status": "invalid"
        }

    return {
        "validation_errors": [],
        "status": "valid"
    }


def retry_extraction_node(state: AgentState):
    """
    Retry extraction when validation fails.
    """

    document_text = state.get(
        "document_text"
    )

    validation_errors = state.get(
        "validation_errors",
        []
    )

    retry_count = state.get(
        "retry_count",
        0
    )

    if not document_text:
        return {
            "retry_count": retry_count + 1,
            "status": "failed"
        }

    chain = get_document_extraction_chain()

    retry_context = f"""
The previous startup document extraction failed validation.

Validation errors:

{validation_errors}

Re-analyze the ORIGINAL document carefully.

Important rules:

1. First determine whether this is actually a startup-related document.
2. Do not assume every organisation is a startup.
3. Use only information present in the document.
4. Do not invent missing information.
5. Return null for unavailable values.
6. Return empty lists for unavailable lists.
7. Follow the required structured schema exactly.
8. Evidence locations must use exact PAGE, SLIDE, or PARAGRAPH markers.

ORIGINAL DOCUMENT:

{document_text}
"""

    result = chain.invoke(
        {
            "document_text": retry_context
        }
    )

    return {
        "extracted_data": result.model_dump(),
        "retry_count": retry_count + 1,
        "status": "retried"
    }


def finalize_node(state: AgentState):
    """
    Finalize successful startup analysis.
    """

    validation_errors = state.get(
        "validation_errors",
        []
    )

    if validation_errors:
        return {
            "status": "completed_with_warnings"
        }

    return {
        "status": "completed"
    }


def finalize_non_startup_node(
    state: AgentState
):
    """
    Finalize a valid non-startup classification.
    """

    return {
        "status": "not_startup_document"
    }