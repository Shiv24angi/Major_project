from typing import Any, Dict, List, Set


def validate_findings(
    findings: List[Dict[str, Any]],
    available_files: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Validate that every evidence path referenced by an Agent 6
    finding actually exists in the repository context.

    Invalid evidence is removed.

    Findings with no remaining evidence are marked as unknown
    unless they are explicitly based on pipeline metadata.
    """

    # ---------------------------------------------------------
    # Build the set of files that actually exist
    # ---------------------------------------------------------

    available_paths: Set[str] = set()

    for file in available_files:

        path = file.get("path")

        if path:
            available_paths.add(path)

    # ---------------------------------------------------------
    # Validate every finding
    # ---------------------------------------------------------

    validated_findings = []

    for finding in findings:

        if not isinstance(finding, dict):
            continue

        category = finding.get(
            "category",
            "technical"
        )

        claim = finding.get(
            "claim",
            ""
        )

        status = finding.get(
            "status",
            "unknown"
        )

        evidence = finding.get(
            "evidence",
            []
        )

        # Make sure evidence is actually an array
        if not isinstance(evidence, list):
            evidence = []

        # -----------------------------------------------------
        # Keep only evidence paths that actually exist
        # -----------------------------------------------------

        valid_evidence = []

        for path in evidence:

            if not isinstance(path, str):
                continue

            if path in available_paths:

                valid_evidence.append(path)

        # -----------------------------------------------------
        # If the LLM supplied evidence that does not exist,
        # downgrade the finding to unknown.
        # -----------------------------------------------------

        if evidence and not valid_evidence:

            status = "unknown"

        # -----------------------------------------------------
        # Never allow unsupported evidence
        # -----------------------------------------------------

        if status == "supported" and not valid_evidence:

            status = "unknown"

        # -----------------------------------------------------
        # Create cleaned finding
        # -----------------------------------------------------

        validated_findings.append({

            "category": category,

            "claim": claim,

            "status": status,

            "evidence": valid_evidence,
        })

    return validated_findings