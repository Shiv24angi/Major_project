from fastapi import APIRouter

from models.github_model import GitHubRequest

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


@router.post("/analyze")
def analyze_repository(request: GitHubRequest):

    # -------------------------
    # 1. Parse GitHub URL
    # -------------------------

    parts = request.github_url.rstrip("/").split("/")

    owner = parts[-2]
    repo_name = parts[-1]


    # -------------------------
    # 2. Get repository
    # -------------------------

    repo = get_repository(f"{owner}/{repo_name}")


    # -------------------------
    # 3. Get README
    # -------------------------

    readme = get_readme(repo)


    # -------------------------
    # 4. Get repository structure
    # -------------------------

    structure = get_repository_structure(repo)


    # -------------------------
    # 5. Select important files
    # -------------------------

    selected_files = select_important_files(structure)


    # -------------------------
    # 6. Read selected files
    # -------------------------

    file_contents = {}

    for file_path in selected_files:

        try:

            file_contents[file_path] = get_file_content(
                repo,
                file_path
            )

        except Exception as e:

            file_contents[file_path] = (
                f"Could not read file: {str(e)}"
            )


    # -------------------------
    # 7. Build Agent 6 context
    # -------------------------

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


    # -------------------------
    # 8. Analyze repository
    # -------------------------

    analysis = analyze_codebase(agent6_context)


    # -------------------------
    # 9. Create investigation plan
    # -------------------------

    investigation = create_investigation_plan(analysis)


    # -------------------------
    # 10. Return Agent 6 result
    # -------------------------

    return {

        "owner": repo.owner.login,

        "repository": repo.name,

        "agent6_analysis": analysis,

        "investigation": investigation

    }