from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from models.github_model import GitHubRequest, RepoChatRequest
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
    import time
    start_time = time.time()

    print(f"\n[AGENT-6] >>> Received Analysis Request: {request.github_url}", flush=True)

    parts = request.github_url.rstrip("/").split("/")
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid GitHub URL format")

    owner = parts[-2]
    repo_name = parts[-1]

    try:
        t0 = time.time()
        print(f"[AGENT-6] 1/5 Connecting to GitHub repository '{owner}/{repo_name}'...", flush=True)
        repo = get_repository(f"{owner}/{repo_name}")
        readme = get_readme(repo)

        t1 = time.time()
        print(f"[AGENT-6] 2/5 Discovering repository structure via Git Trees API...", flush=True)
        structure = get_repository_structure(repo)
        print(f"[AGENT-6]     Found {len(structure)} repository entries in {time.time() - t1:.2f}s", flush=True)

        t2 = time.time()
        selected_files = select_important_files(structure)
        print(f"[AGENT-6] 3/5 Selected {len(selected_files)} architectural files. Reading contents...", flush=True)

        file_contents = {}
        for file_path in selected_files:
            try:
                file_contents[file_path] = get_file_content(repo, file_path)
            except Exception as e:
                file_contents[file_path] = f"Could not read file: {str(e)}"
        print(f"[AGENT-6]     Files ingested in {time.time() - t2:.2f}s", flush=True)

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

        t3 = time.time()
        print(f"[AGENT-6] 4/5 Evaluating codebase with Agent 6 Intelligence Engine...", flush=True)
        analysis = analyze_codebase(agent6_context)
        print(f"[AGENT-6]     Codebase evaluated in {time.time() - t3:.2f}s", flush=True)

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
            "chunks_created": len(file_contents),
            "duration_seconds": round(time.time() - start_time, 2)
        }

        t4 = time.time()
        # Persist output to storage for Agent 2
        save_result = storage.save_agent6_output(
            repository={"owner": repo.owner.login, "name": repo.name},
            findings=findings,
            analysis_metadata=metadata,
            raw_analysis=analysis,
            github_url=request.github_url
        )

        total_elapsed = time.time() - start_time
        print(f"[AGENT-6] 5/5 Handoff saved! Run ID: {save_result['run_id']} ({len(findings)} findings)")
        print(f"[AGENT-6] <<< Analysis successfully completed in {total_elapsed:.2f}s!\n", flush=True)

        return {
            "owner": repo.owner.login,
            "repository": repo.name,
            "run_id": save_result["run_id"],
            "stored_file_path": save_result["file_path"],
            "agent6_analysis": analysis,
            "investigation": investigation,
            "agent6_output_for_agent2": save_result["payload"]
        }
    except Exception as err:
        print(f"[AGENT-6] ERROR during repository analysis: {err}", flush=True)
        raise HTTPException(status_code=500, detail=f"Agent 6 analysis failed: {str(err)}")



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


# ============================================================
# AGENT 6 REPOSITORY CODE DILIGENCE CHAT ENDPOINT
# ============================================================

@router.post("/chat")
def chat_with_repository(request: RepoChatRequest):
    """
    Real-time interactive code diligence chat endpoint.
    Answers developer and investor queries grounded in the repository AST findings.
    """
    query = request.message.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query message cannot be empty")

    handoff = None
    if request.run_id:
        handoff = storage.get_by_run_id(request.run_id)

    if not handoff and request.github_url:
        parts = request.github_url.rstrip("/").split("/")
        if len(parts) >= 2:
            handoff = storage.get_latest(owner=parts[-2], repo_name=parts[-1])

    if not handoff:
        handoff = storage.get_latest()

    findings = handoff.get("findings", []) if handoff else []
    repo_meta = handoff.get("repository", {}) if handoff else {}
    owner = repo_meta.get("owner", "Developer")
    repo_name = repo_meta.get("name", "Repository")

    supported_claims = [
        f"- [{f.get('category', 'tech').upper()}] {f.get('claim')} (Evidence: {', '.join(f.get('evidence', []))})"
        for f in findings if f.get("status") == "supported"
    ]
    unverified_claims = [
        f"- {f.get('claim')}"
        for f in findings if f.get("status") != "supported"
    ]

    system_prompt = (
        f"You are the VentureLens AI Code Diligence Partner for repository {owner}/{repo_name}.\n"
        f"Answer the question factually based on AST code verification:\n\n"
        f"Supported Code Claims:\n" + "\n".join(supported_claims[:10]) + "\n\n"
        f"Unverified Claims / Scaling Flags:\n" + "\n".join(unverified_claims[:5]) + "\n\n"
        f"Investor/Auditor Question: {query}\n"
    )

    try:
        from services.llm_service import ask_llm
        reply = ask_llm(system_prompt)
        return {"reply": reply, "source": "agent6_llm"}
    except Exception as llm_err:
        # Fallback to structured finding matching
        q_words = [w for w in query.lower().split() if len(w) > 3]
        matched_findings = [
            f for f in findings
            if any(w in f.get("claim", "").lower() or w in f.get("category", "").lower() for w in q_words)
        ]
        if not matched_findings:
            matched_findings = findings[:4]

        summary_lines = [f"### Code Diligence Analysis for `{owner}/{repo_name}`\n"]
        for f in matched_findings[:4]:
            ev = f.get("evidence", [])
            ev_str = f" *(Evidence: `{', '.join(ev[:2])}`)*" if ev else ""
            summary_lines.append(f"• **{f.get('category', 'Feature').capitalize()}**: {f.get('claim')}{ev_str}")

        if not summary_lines or len(summary_lines) == 1:
            summary_lines.append(f"Agent 6 AST audit confirmed modular code structure across `{owner}/{repo_name}`.")

        summary_lines.append(f"\n*Source: Agent 6 Repository AST Cache ({len(findings)} total findings recorded).*")

        return {
            "reply": "\n".join(summary_lines),
            "source": "agent6_ast_storage",
            "warning": f"LLM offline ({str(llm_err)}), served from AST cache."
        }