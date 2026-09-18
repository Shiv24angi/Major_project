from pathlib import Path

from app.graph.state import AgentState
from app.services.document_service import extract_document_text
from app.chains.document_extraction import get_document_extraction_chain

import json

from app.chains.multi_document_merge import (
    get_multi_document_merge_chain
)

def parse_multiple_documents_node(state: AgentState):
    """
    Parse all uploaded documents.

    Each document is kept separately so that later
    we know which information came from which file.
    """

    file_paths = state.get("file_paths", [])

    if not file_paths:
        return {
            "documents": [],
            "validation_errors": [
                "No documents were provided"
            ],
            "status": "parse_failed"
        }

    documents = []
    errors = []

    for file_path in file_paths:

        try:
            result = extract_document_text(file_path)

            document_text = result.get(
                "full_text",
                ""
            )

            if not document_text.strip():
                errors.append(
                    f"No readable text found in {Path(file_path).name}"
                )
                continue

            documents.append(
                {
                    "file_path": file_path,
                    "filename": Path(file_path).name,
                    "document_type": result.get(
                        "document_type"
                    ),
                    "text": document_text,
                    "metadata": result.get(
                        "metadata",
                        {}
                    )
                }
            )

        except Exception as e:
            errors.append(
                f"Failed to parse {Path(file_path).name}: {str(e)}"
            )

    # None of the documents worked
    if not documents:
        return {
            "documents": [],
            "validation_errors": errors,
            "status": "parse_failed"
        }

    return {
        "documents": documents,
        "validation_errors": errors,
        "status": "documents_parsed"
    }


def analyze_multiple_documents_node(state: AgentState):
    """
    Analyze every parsed document separately using
    our existing LangChain startup extraction chain.
    """

    documents = state.get(
        "documents",
        []
    )

    if not documents:
        errors = list(state.get("validation_errors", []))
        if not errors:
            errors = ["No parsed documents are available for analysis"]
        return {
            "document_analyses": [],
            "validation_errors": errors,
            "status": "analysis_failed"
        }

    chain = get_document_extraction_chain()

    analyses = []

    errors = list(
        state.get(
            "validation_errors",
            []
        )
    )

    for document in documents:

        try:
            result = chain.invoke(
                {
                    "document_text": document["text"]
                }
            )

            analyses.append(
                {
                    "filename": document["filename"],
                    "file_path": document["file_path"],
                    "document_type": document[
                        "document_type"
                    ],
                    "analysis": result.model_dump()
                }
            )

        except Exception as e:
            errors.append(
                f"Failed to analyze "
                f"{document['filename']}: {str(e)}"
            )

    if not analyses:
        return {
            "document_analyses": [],
            "validation_errors": errors,
            "status": "analysis_failed"
        }

    return {
        "document_analyses": analyses,
        "validation_errors": errors,
        "status": "documents_analyzed"
    }


def merge_document_analyses_node(state: AgentState):
    """
    Merge individual document analyses into one
    unified startup profile.
    """

    document_analyses = state.get(
        "document_analyses",
        []
    )

    if not document_analyses:
        errors = list(state.get("validation_errors", []))
        if not errors:
            errors = ["No document analyses are available for merging"]
        return {
            "merged_analysis": None,
            "validation_errors": errors,
            "status": "merge_failed"
        }

    # Keep only startup-related documents.
    startup_analyses = []

    for item in document_analyses:
        analysis = item.get(
            "analysis",
            {}
        )

        if analysis.get(
            "is_startup_document",
            False
        ):
            startup_analyses.append(
                item
            )

    if not startup_analyses:
        errors = list(state.get("validation_errors", []))
        errors.append("None of the uploaded documents were identified as startup-related.")
        return {
            "merged_analysis": None,
            "validation_errors": errors,
            "status": "no_startup_documents"
        }

    chain = get_multi_document_merge_chain()

    analyses_json = json.dumps(
        startup_analyses,
        indent=2,
        ensure_ascii=False,
        default=str
    )

    try:
        result = chain.invoke(
            {
                "document_analyses": analyses_json
            }
        )

        return {
            "merged_analysis": result.model_dump(),
            "status": "analyses_merged"
        }

    except Exception as e:
        errors = list(
            state.get(
                "validation_errors",
                []
            )
        )

        errors.append(
            f"Failed to merge document analyses via LLM: {str(e)}"
        )

        # Fallback to single document structure if merge chain encounters an issue
        first_analysis = startup_analyses[0].get("analysis", {})
        fallback_merged = {
            "startup_name": first_analysis.get("startup_name"),
            "description": first_analysis.get("description"),
            "industry": first_analysis.get("industry"),
            "sector": first_analysis.get("sector"),
            "founders": first_analysis.get("founders", []),
            "product": first_analysis.get("product"),
            "business_model": first_analysis.get("business_model"),
            "target_customers": first_analysis.get("target_customers"),
            "financials": first_analysis.get("financials", {}),
            "funding_raised": first_analysis.get("funding_raised"),
            "investors": first_analysis.get("investors", []),
            "customers": first_analysis.get("customers"),
            "traction": first_analysis.get("traction"),
            "market_size": first_analysis.get("market_size", {}),
            "competitors": first_analysis.get("competitors", []),
            "risks": first_analysis.get("risks", []),
            "key_metrics": first_analysis.get("key_metrics", {}),
            "missing_information": first_analysis.get("missing_information", []),
            "source_files": [item["filename"] for item in startup_analyses],
        }

        return {
            "merged_analysis": fallback_merged,
            "validation_errors": errors,
            "status": "analyses_merged"
        }