import json

from services.llm_service import ask_llm
from services.agent6.analyzers import RepositoryAnalysis

from services.github_service import (
    get_repository,
    get_readme,
    get_full_repository_structure,
)

from services.agent6.chunker import chunk_file


# ============================================================
# 1. LOAD REPOSITORY
# ============================================================

def load_repository(state):
    """
    Load the GitHub repository from the supplied URL.
    """

    github_url = state["github_url"]

    parts = github_url.rstrip("/").split("/")

    if len(parts) < 2:
        raise ValueError("Invalid GitHub URL")

    owner = parts[-2]
    repo_name = parts[-1]

    repo = get_repository(
        f"{owner}/{repo_name}"
    )

    return {
        "repository": {
            "owner": repo.owner.login,
            "name": repo.name,
        }
    }


# ============================================================
# 2. DISCOVER FILES
# ============================================================

def discover_files(state):
    """
    Recursively discover the repository structure.
    """

    repository = state["repository"]

    repo = get_repository(
        f"{repository['owner']}/{repository['name']}"
    )

    readme = get_readme(repo)

    structure = get_full_repository_structure(repo)

    files = []

    for item in structure:

        files.append({
            "name": item["name"],
            "path": item["path"],
            "type": item["type"],
        })

    print(
        "\n========== AGENT 6 DISCOVERY =========="
    )

    print(
        "Files discovered:",
        len(files)
    )

    return {
        "readme": readme,
        "files": files,
    }


# ============================================================
# 3. SELECT IMPORTANT FILES
# ============================================================

def select_files(state):
    """
    Select a representative set of important files
    from the complete repository.
    """

    from services.agent6.file_selector import (
        select_important_files
    )

    files = state.get(
        "files",
        []
    )

    selected_files = select_important_files(
        files,
        max_files=15
    )

    print(
        "\n========== AGENT 6 FILE SELECTION =========="
    )

    print(
        "Total files discovered:",
        len(files)
    )

    print(
        "Selected files:",
        len(selected_files)
    )

    print(
        "\n========== SELECTED FILES =========="
    )

    for file_path in selected_files:
        print(file_path)

    return {
        "selected_files": selected_files
    }


# ============================================================
# 4. READ SELECTED FILES
# ============================================================

def read_files(state):
    """
    Read the actual source contents of selected files.
    """

    from services.agent6.code_reader import (
        read_selected_files
    )

    repository = state["repository"]

    selected_files = state.get(
        "selected_files",
        []
    )

    file_contents = read_selected_files(
        repository,
        selected_files
    )

    print(
        "\n========== AGENT 6 CODE READER =========="
    )

    print(
        "Files requested:",
        len(selected_files)
    )

    print(
        "Files successfully read:",
        len(file_contents)
    )

    return {
        "file_contents": file_contents
    }


# ============================================================
# 5. CHUNK SOURCE FILES
# ============================================================

def chunk_files(state):
    """
    Split the contents of selected files into
    manageable chunks for Agent 6.
    """

    file_contents = state.get(
        "file_contents",
        {}
    )

    all_chunks = []

    for file_path, content in file_contents.items():

        if not content:
            continue

        # Skip code-reader error messages
        if (
            isinstance(content, str)
            and content.startswith("Could not read")
        ):
            continue

        chunks = chunk_file(
            file_path=file_path,
            content=content,
            max_chars=12000,
            overlap=500,
        )

        all_chunks.extend(chunks)

    print(
        "\n========== AGENT 6 CHUNKING =========="
    )

    print(
        "Files read:",
        len(file_contents)
    )

    print(
        "Chunks created:",
        len(all_chunks)
    )

    print(
        "\n========== FIRST 5 CHUNKS =========="
    )

    for chunk in all_chunks[:5]:

        print(
            f"{chunk['file_path']} | "
            f"chunk {chunk['chunk_index'] + 1}/"
            f"{chunk['total_chunks']} | "
            f"{len(chunk['content'])} chars"
        )

    return {
        "chunks": all_chunks
    }


# ============================================================
# 6. ANALYZE REPOSITORY
# ============================================================

def analyze_repository(state):

    repository = state["repository"]

    readme = state.get(
        "readme",
        ""
    )

    files = state.get(
        "files",
        []
    )

    selected_files = state.get(
        "selected_files",
        []
    )

    file_contents = state.get(
        "file_contents",
        {}
    )

    chunks = state.get(
        "chunks",
        []
    )

    # ============================================================
    # BUILD REPOSITORY CONTEXT
    # ============================================================

    repository_context = {
    "repository": repository,

    "readme": readme,

    "selected_files": selected_files,

    "source_code": file_contents,

    "chunks": chunks,

    "analysis_metadata": {
        "files_discovered": len(files),
        "files_selected": len(selected_files),
        "files_read": len(file_contents),
        "chunks_created": len(chunks)
    }
}

    # ============================================================
    # AGENT 6 PROMPT
    # ============================================================

    prompt = f"""
You are Agent 6 in an AI startup evaluation system.

Your job is to inspect and understand the technical project
represented by a GitHub repository.

You are performing a repository and codebase analysis.

IMPORTANT RULES:

1. Only use information supplied in the repository context.
2. Do not invent facts.
3. Do not use outside knowledge.
4. Clearly distinguish supported facts from inference.
5. Do not score the startup.
6. Do not make an investment decision.
7. Do not write the final startup report.
8. Use actual source-code contents when making technical claims.
9. Every important claim must contain evidence.
10. Evidence must reference files that actually exist in the
    supplied repository context.
11. If there is not enough evidence, mark the finding as
    "unknown".
12. Do not claim that the entire repository was inspected if
    only selected files were supplied.

You have access to:

- README
- complete repository file listing
- selected important files
- actual source-code contents of selected files
- source-code chunks

Analyze:

1. Project identity
2. Problem being solved
3. Features
4. Technology stack
5. Architecture
6. Important technical components
7. Implementation details
8. Technical strengths
9. Technical weaknesses
10. Project completeness
11. Potential product/startup signals
12. Missing information

For every important finding:

- "supported" = directly evidenced by supplied repository data
- "inferred" = reasonable conclusion based on supplied evidence
- "unknown" = insufficient evidence

IMPORTANT EVIDENCE RULE:

Evidence must reference actual repository paths
or supplied repository information.

Do not invent evidence paths.

Return ONLY valid JSON.

The JSON MUST have exactly this structure:

{{
    "findings": [
        {{
            "category": "project|problem|feature|technology|architecture|technical",
            "claim": "Specific finding",
            "status": "supported|inferred|unknown",
            "evidence": [
                "README.md"
            ]
        }}
    ]
}}

Additional rules:

- "findings" must always be an array.
- Every finding must contain:
  - category
  - claim
  - status
  - evidence
- "status" must be exactly:
  "supported"
  "inferred"
  or
  "unknown"
- "evidence" must always be an array.
- Do not invent file paths.
- Do not include Markdown.
- Do not include ```json.
- Do not include explanations outside the JSON.

REPOSITORY CONTEXT:

{json.dumps(
    repository_context,
    indent=2
)}
"""

    # ============================================================
    # CALL LLM
    # ============================================================

    result = ask_llm(prompt)

    # ============================================================
    # PARSE RESULT
    # ============================================================

    try:

        parsed = json.loads(result)

        analysis = RepositoryAnalysis.model_validate(
            parsed
        )

        final_analysis = analysis.model_dump()

        findings = final_analysis.get(
            "findings",
            []
        )

        # ========================================================
        # BUILD AGENT 6 → AGENT 2 HANDOFF
        # ========================================================

        analysis_metadata = {

            "files_discovered": len(files),

            "files_selected": len(
                selected_files
            ),

            "files_read": len(
                file_contents
            ),

            "chunks_created": len(
                chunks
            )
        }

        agent6_output = {

            "agent": "agent6",

            "repository": repository,

            "analysis": final_analysis,

            "findings": findings,

            "metadata": analysis_metadata
        }

        # ========================================================
        # PRINT RESULTS
        # ========================================================

        print(
            "\n========== AGENT 6 ANALYSIS =========="
        )

        print(
            json.dumps(
                final_analysis,
                indent=2
            )
        )

        print(
            "\n========== AGENT 6 HANDOFF =========="
        )

        print(
            json.dumps(
                agent6_output,
                indent=2
            )
        )

        # ========================================================
        # RETURN LANGGRAPH STATE
        # ========================================================

        return {

            "final_analysis": final_analysis,

            "findings": findings,

            "agent6_output": agent6_output,

            "analysis_metadata": analysis_metadata
        }

    except Exception as e:

        print(
            "\n========== AGENT 6 PARSE ERROR =========="
        )

        print(
            str(e)
        )

        print(
            "\n========== RAW LLM RESPONSE =========="
        )

        print(
            result
        )

        return {

            "error": str(e),

            "raw_analysis": result,

            "findings": []
        }

    # --------------------------------------------------------
    # Call LLM
    # --------------------------------------------------------

    result = ask_llm(prompt)

    # --------------------------------------------------------
    # Parse response
    # --------------------------------------------------------

    try:

        parsed = json.loads(result)

        analysis = RepositoryAnalysis.model_validate(
            parsed
        )

        print(
            "\n========== AGENT 6 ANALYSIS =========="
        )

        print(
            json.dumps(
                analysis.model_dump(),
                indent=2
            )
        )

        return {
            "final_analysis": analysis.model_dump(),
            "findings": analysis.findings,
        }

    except Exception as e:

        print(
            "\n========== AGENT 6 PARSE ERROR =========="
        )

        print(str(e))

        print(
            "\n========== RAW LLM RESPONSE =========="
        )

        print(result)

        return {
            "error": str(e),
            "raw_analysis": result,
            "findings": [],
        }   

# ============================================================
# 7. VALIDATE EVIDENCE
# ============================================================

def validate_evidence(state):

    from services.agent6.evidence_validator import (
        validate_findings
    )

    findings = state.get(
        "findings",
        []
    )

    files = state.get(
        "files",
        []
    )

    validated_findings = validate_findings(
        findings,
        files
    )

    print(
        "\n========== AGENT 6 EVIDENCE VALIDATION =========="
    )

    print(
        f"Findings before validation: {len(findings)}"
    )

    print(
        f"Findings after validation: {len(validated_findings)}"
    )

    for finding in validated_findings:

        print(
            "\nClaim:",
            finding.get("claim", "")
        )

        print(
            "Status:",
            finding.get("status", "unknown")
        )

        print(
            "Evidence:",
            finding.get("evidence", [])
        )

    return {
        "findings": validated_findings,

        "final_analysis": {
            "findings": validated_findings
        }
    }