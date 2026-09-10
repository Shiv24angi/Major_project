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
    import json

    from services.agent6.analyzers import validate_analysis
    from services.agent6.llm import ask_llm

    repository = state.get("repository", {})
    readme = state.get("readme", "")
    selected_files = state.get("selected_files", [])
    file_contents = state.get("file_contents", {})
    chunks = state.get("chunks", [])

    source_code = "\n\n".join(
        f"===== FILE: {path} =====\n{content}"
        for path, content in file_contents.items()
    )

    chunk_context = "\n\n".join(
        f"""
===== FILE: {chunk["file_path"]} =====
===== CHUNK {chunk["chunk_index"] + 1}/{chunk["total_chunks"]} =====
{chunk["content"]}
"""
        for chunk in chunks
    )

    prompt = f"""
You are Agent 6, the repository analysis agent in an AI startup
evaluation system.

Your job is to inspect the provided GitHub repository evidence and
produce a structured technical and product evaluation.

IMPORTANT RULES:

1. Use ONLY evidence provided in this prompt.
2. Do NOT use outside knowledge.
3. Do NOT invent files, endpoints, database tables, technologies,
   features, security mechanisms, or architecture.
4. Every important conclusion must include repository evidence.
5. Evidence must reference files that were actually provided/read.
6. If something cannot be determined from the provided repository
   evidence, mark it as "unknown".
7. Clearly distinguish:
   - supported = directly shown by repository evidence
   - inferred = reasonable conclusion from repository evidence
   - unknown = insufficient evidence
8. Do not claim that something is absent from the entire repository
   merely because it was not included in the selected files.
   Instead say that it was "not observed in the reviewed files".
9. Market potential and monetization are allowed to be inferred,
   but MUST be clearly marked as inferred unless directly supported
   by repository evidence.
10. Scores must be justified by evidence.
11. Do not make investment decisions.
12. Do not recommend whether someone should invest.
13. Do not produce the final startup report.
14. Your output is an intermediate structured assessment for Agent 2.

REPOSITORY:

{json.dumps(repository, indent=2)}

README:

{readme}

SELECTED FILES:

{json.dumps(selected_files, indent=2)}

FILE CONTENT:

{source_code}

CHUNKED CODE:

{chunk_context}

REVIEW COVERAGE:

Files discovered: {len(state.get("files", []))}
Files selected: {len(selected_files)}
Files read: {len(file_contents)}
Chunks created: {len(chunks)}

==================================================
ANALYSIS REQUIREMENTS
==================================================

Analyze the repository in the following areas.

PROJECT
- Project name
- Project type
- Purpose

PROBLEM
- What problem the project appears to solve
- What user/business problem is addressed
- Capabilities related to solving the problem

FEATURES
Identify implemented or clearly documented features.

TECH STACK
Identify technologies actually found in the repository.

ARCHITECTURE
Analyze:
- Architecture style
- Modules/components
- Separation of responsibilities
- Data flow
- Important architectural observations

DATABASE
Analyze when evidence exists:
- Entities
- Relationships
- Indexes
- Constraints
- Unique constraints
- Important fields

If database information was not present in the reviewed files,
mark the relevant information as unknown.

API ANALYSIS
Analyze:
- Major endpoints
- HTTP methods
- Authentication requirements
- Public endpoints
- Protected endpoints
- Validation
- Error handling

TECHNICAL MATURITY
Analyze:
- Testing
- Documentation
- Dockerization
- Error handling
- Configuration management
- Code organization
- Production readiness

SECURITY
Analyze:
- JWT
- Password hashing
- Validation
- Authentication guards
- Secrets/configuration
- Hardcoded credentials
- Authorization/RBAC gaps
- API exposure

Do not claim that credentials are absent from the entire repository
unless the repository evidence actually proves this.

SCALABILITY
Analyze:
- Database architecture
- Statelessness
- Pagination
- Caching opportunities
- Potential bottlenecks
- Horizontal scaling readiness

CODE QUALITY
Analyze:
- Modularity
- Separation of concerns
- DTO usage
- Exception handling
- Testing
- Maintainability
- Technical debt

MARKET POTENTIAL
Based ONLY on repository evidence and clearly marked inference:
- Problem
- Potential target customers
- Differentiation
- Potential use cases
- Adoption potential

Do not claim actual market traction, customers, revenue,
or adoption unless directly evidenced.

MONETIZATION
Identify evidence-based or clearly inferred possibilities such as:
- SaaS subscription
- Transaction/booking fee
- Enterprise/API plans
- Other possibilities

Clearly distinguish inference from repository-supported facts.

RISKS
Identify:
- Security risks
- Architecture risks
- Product risks
- Scalability risks
- Missing/unfinished functionality

FINAL PROJECT ASSESSMENT

Give scores from 0 to 10 for:

- Technical maturity
- Scalability
- Security
- Code quality
- Market potential
- Monetization potential

Every score must include:
- score
- assessment
- evidence

==================================================
EVIDENCE FORMAT
==================================================

Use this format for evidence:

{{
    "file": "path/to/file.ts",
    "reason": "Explains exactly what in this file supports the conclusion."
}}

Do NOT cite files that were not provided.

==================================================
OUTPUT FORMAT
==================================================

Return ONLY valid JSON.

The JSON must follow this structure:

{{
    "project": {{
        "name": "...",
        "type": "...",
        "purpose": "...",
        "evidence": []
    }},

    "problem": {{
        "summary": "...",
        "capabilities": [],
        "evidence": []
    }},

    "features": [],

    "tech_stack": [],

    "architecture": {{
        "style": "...",
        "modules": [],
        "data_flow": "...",
        "observations": [],
        "evidence": []
    }},

    "database": {{
        "entities": [],
        "relationships": [],
        "indexes": [],
        "constraints": [],
        "important_fields": [],
        "evidence": []
    }},

    "api_analysis": {{
        "endpoints": [],
        "authentication": [],
        "public_endpoints": [],
        "protected_endpoints": [],
        "validation": [],
        "error_handling": [],
        "evidence": []
    }},

    "technical_maturity": {{
        "testing": "...",
        "documentation": "...",
        "dockerization": "...",
        "error_handling": "...",
        "configuration_management": "...",
        "code_organization": "...",
        "production_readiness": "...",
        "evidence": []
    }},

    "security": {{
        "jwt": "...",
        "password_hashing": "...",
        "validation": "...",
        "authentication_guards": "...",
        "secrets_configuration": "...",
        "hardcoded_credentials": "...",
        "authorization_gaps": "...",
        "api_exposure": "...",
        "evidence": []
    }},

    "scalability": {{
        "database_architecture": "...",
        "stateless_api": "...",
        "pagination": "...",
        "caching_opportunities": [],
        "bottlenecks": [],
        "horizontal_scaling_readiness": "...",
        "evidence": []
    }},

    "code_quality": {{
        "modularity": "...",
        "separation_of_concerns": "...",
        "dto_usage": "...",
        "exception_handling": "...",
        "testing": "...",
        "maintainability": "...",
        "technical_debt": [],
        "evidence": []
    }},

    "market_potential": {{
        "problem": "...",
        "target_customers": [],
        "differentiation": [],
        "potential_use_cases": [],
        "adoption_potential": "...",
        "evidence": []
    }},

    "monetization": {{
        "possibilities": []
    }},

    "risks": [],

    "final_project_assessment": {{
        "technical_maturity": {{
            "score": 0,
            "assessment": "...",
            "evidence": []
        }},
        "scalability": {{
            "score": 0,
            "assessment": "...",
            "evidence": []
        }},
        "security": {{
            "score": 0,
            "assessment": "...",
            "evidence": []
        }},
        "code_quality": {{
            "score": 0,
            "assessment": "...",
            "evidence": []
        }},
        "market_potential": {{
            "score": 0,
            "assessment": "...",
            "evidence": []
        }},
        "monetization_potential": {{
            "score": 0,
            "assessment": "...",
            "evidence": []
        }},
        "overall_assessment": "..."
    }}
}}
"""

    try:
        raw_response = ask_llm(prompt)

        print("\n===== RAW AGENT 6 ANALYSIS =====")
        print(raw_response)

        parsed = json.loads(raw_response)

        validated = validate_analysis(parsed)

        final_analysis = validated.model_dump()

        findings = []

        for category, section in final_analysis.items():

            if isinstance(section, dict):
                evidence = section.get("evidence", [])

                if evidence:
                    findings.append({
                        "category": category,
                        "claim": section,
                        "status": "supported",
                        "evidence": evidence,
                    })

            elif isinstance(section, list):

                for item in section:

                    if isinstance(item, dict):
                        evidence = item.get("evidence", [])

                        if evidence:
                            findings.append({
                                "category": category,
                                "claim": item,
                                "status": "supported",
                                "evidence": evidence,
                            })

        print("\n===== STRUCTURED AGENT 6 ANALYSIS =====")
        print(json.dumps(final_analysis, indent=2))

        return {
            "final_analysis": final_analysis,
            "findings": findings,
            "raw_analysis": raw_response,
        }

    except Exception as e:

        print("\n===== AGENT 6 ANALYSIS ERROR =====")
        print(str(e))

        return {
            "error": str(e),
            "raw_analysis": raw_response if "raw_response" in locals() else "",
            "final_analysis": {},
            "findings": [],
        }

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
        print("\n========== AGENT 6 PARSE ERROR ==========")
        print(str(e))
        print("\n========== RAW LLM RESPONSE ==========")
        print(result)

        return {
            "error": str(e),
            "raw_analysis": result,
            "findings": []
        }


# ============================================================
# 7. VALIDATE EVIDENCE & PERSIST FOR AGENT 2
# ============================================================

def validate_evidence(state):

    from services.agent6.evidence_validator import (
        validate_findings
    )
    from services.agent6.storage import storage

    findings = state.get(
        "findings",
        []
    )

    files = state.get(
        "files",
        []
    )

    repository = state.get(
        "repository",
        {"owner": "unknown", "name": "unknown"}
    )

    analysis_metadata = state.get(
        "analysis_metadata",
        {}
    )

    github_url = state.get(
        "github_url",
        ""
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

    # Persist the validated output to storage for Agent 2 consumption
    save_result = storage.save_agent6_output(
        repository=repository,
        findings=validated_findings,
        analysis_metadata=analysis_metadata,
        raw_analysis=state.get("final_analysis", {}),
        github_url=github_url
    )

    agent6_output = save_result["payload"]
    run_id = save_result["run_id"]
    file_path = save_result["file_path"]

    return {
        "findings": validated_findings,
        "final_analysis": {
            "findings": validated_findings
        },
        "agent6_output": agent6_output,
        "stored_file_path": file_path,
        "run_id": run_id
    }
