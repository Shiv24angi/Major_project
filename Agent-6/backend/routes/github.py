from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from models.github_model import GitHubRequest
from services.agent6.graph import agent6_graph
from services.agent6.storage import storage

from services.github_service import (
    get_repository,
    get_readme,
    get_repository_structure,
    get_file_content
)

from services.analysis_service import (
    analyze_codebase,
    create_investigation_plan
)

from services.codebase_service import select_important_files


router = APIRouter()


# ============================================================
# AGENT 6 REPOSITORY ANALYSIS (DIRECT & GRAPH-BASED)
# ============================================================

@router.post("/analyze")
def analyze_repository(request: GitHubRequest):
    """
    Standard analysis endpoint. Parses repository, executes analysis,
    saves structured output into persistent storage for Agent 2,
    and returns findings with handoff references.
    """
    parts = request.github_url.rstrip("/").split("/")
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid GitHub URL format")

    owner = parts[-2]
    repo_name = parts[-1]

    repo = get_repository(f"{owner}/{repo_name}")
    readme = get_readme(repo)
    structure = get_repository_structure(repo)
    selected_files = select_important_files(structure)

    file_contents = {}
    for file_path in selected_files:
        try:
            file_contents[file_path] = get_file_content(repo, file_path)
        except Exception as e:
            file_contents[file_path] = f"Could not read file: {str(e)}"

    agent6_context = {
        "repository": {
            "owner": repo.owner.login,
            "name": repo.name
        },
        "readme": readme,
        "repository_structure": structure,
        "selected_files": selected_files,
        "file_contents": file_contents
    }

    analysis = analyze_codebase(agent6_context)
    investigation = create_investigation_plan(analysis)

    # Format findings from analysis
    findings = []
    if isinstance(analysis, dict):
        if "findings" in analysis and isinstance(analysis["findings"], list):
            findings = analysis["findings"]
        else:
            # Flatten sectioned analysis into finding records
            for cat in ["features", "technology_stack", "technical_components", "technical_strengths", "technical_weaknesses", "startup_signals"]:
                items = analysis.get(cat, [])
                if isinstance(items, list):
                    for item in items:
                        if isinstance(item, dict):
                            findings.append({
                                "category": cat,
                                "claim": item.get("feature") or item.get("technology") or item.get("component") or item.get("claim") or item.get("signal") or "",
                                "status": item.get("status", "inferred"),
                                "evidence": item.get("evidence", [])
                            })

    metadata = {
        "files_discovered": len(structure),
        "files_selected": len(selected_files),
        "files_read": len(file_contents),
        "chunks_created": len(file_contents)
    }

    # Persist output to storage for Agent 2
    save_result = storage.save_agent6_output(
        repository={"owner": repo.owner.login, "name": repo.name},
        findings=findings,
        analysis_metadata=metadata,
        raw_analysis=analysis,
        github_url=request.github_url
    )

    return {
        "owner": repo.owner.login,
        "repository": repo.name,
        "run_id": save_result["run_id"],
        "stored_file_path": save_result["file_path"],
        "agent6_analysis": analysis,
        "investigation": investigation,
        "agent6_output_for_agent2": save_result["payload"]
    }


@router.post("/analyze-graph")
def analyze_repository_with_graph(request: GitHubRequest):
    """
    Executes the full LangGraph pipeline for Agent 6.
    Persists validated results and returns the handoff payload.
    """
    result = agent6_graph.invoke({
        "github_url": request.github_url
    })

    return {
        "status": "success",
        "repository": result.get("repository"),
        "run_id": result.get("run_id"),
        "stored_file_path": result.get("stored_file_path"),
        "findings": result.get("findings", []),
        "agent6_output": result.get("agent6_output", {}),
        "metadata": result.get("analysis_metadata", {})
    }


# ============================================================
# AGENT 6 → AGENT 2 HANDOFF STORAGE ENDPOINTS
# ============================================================

@router.get("/handoff/latest")
def get_latest_handoff(
    owner: Optional[str] = Query(None, description="Repository owner"),
    repo: Optional[str] = Query(None, description="Repository name")
):
    """
    Agent 2 access endpoint: Returns the latest Agent 6 evaluation payload.
    """
    data = storage.get_latest(owner=owner, repo_name=repo)
    if not data:
        raise HTTPException(
            status_code=404,
            detail="No Agent 6 evaluation found. Run an evaluation first."
        )
    return data


@router.get("/handoff/runs")
def list_handoff_runs():
    """
    Agent 2 access endpoint: Lists all stored Agent 6 evaluation runs.
    """
    return {
        "total_runs": len(storage.list_runs()),
        "runs": storage.list_runs()
    }


@router.get("/handoff/{run_id}")
def get_handoff_by_run_id(run_id: str):
    """
    Agent 2 access endpoint: Retrieves a specific Agent 6 output payload by run_id.
    """
    data = storage.get_by_run_id(run_id)
    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"Evaluation run '{run_id}' not found."
        )
    return data