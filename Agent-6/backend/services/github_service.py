import os
from github import Github
from dotenv import load_dotenv

load_dotenv()

github_token = os.getenv("GITHUB_TOKEN")

if github_token:
    g = Github(github_token)
else:
    g = Github()

IGNORED_DIR_NAMES = {
    ".git", "node_modules", "__pycache__", "dist", "build", ".next", 
    "coverage", ".cache", "venv", ".venv", "target", "bin", "obj", 
    ".idea", ".vscode", "vendor", "Pods", ".turbo"
}


def get_repository(repo_name: str):
    return g.get_repo(repo_name)


def get_readme(repo):
    try:
        readme = repo.get_readme()
        content = readme.decoded_content.decode("utf-8", errors="ignore")
        return content
    except Exception as e:
        print(f"[github_service] Could not read repository README: {e}", flush=True)
        return ""


def get_repository_structure(repo):
    """
    Fast discovery of repository files using GitHub Git Trees API in 1 request.
    Avoids slow recursive HTTP calls per directory.
    Falls back to bounded shallow traversal if Git Trees API is unavailable.
    """
    all_items = []

    # Method 1: Git Trees API (Single HTTP call for entire tree)
    try:
        branch = repo.default_branch or "main"
        tree = repo.get_git_tree(branch, recursive=True)
        for element in tree.tree:
            parts = element.path.split("/")
            # Filter out ignored directories instantly in memory
            if any(part in IGNORED_DIR_NAMES for part in parts):
                continue

            entry = {
                "name": os.path.basename(element.path),
                "path": element.path,
                "type": "file" if element.type == "blob" else "dir",
                "size": getattr(element, "size", 0)
            }
            all_items.append(entry)

        if all_items:
            return all_items
    except Exception as e:
        print(f"[github_service] Git Tree API fallback: {e}", flush=True)

    # Method 2: Bounded fallback (skips ignored dirs, max depth 3, max 250 items)
    def walk(path="", depth=0):
        if depth > 3 or len(all_items) >= 250:
            return

        try:
            contents = repo.get_contents(path)
        except Exception as e:
            print(f"[github_service] Could not read path '{path}': {e}", flush=True)
            return

        for item in contents:
            if item.name in IGNORED_DIR_NAMES:
                continue

            entry = {
                "name": item.name,
                "path": item.path,
                "type": item.type,
                "size": getattr(item, "size", 0)
            }
            all_items.append(entry)

            if item.type == "dir" and depth < 3:
                walk(item.path, depth + 1)

    walk()
    return all_items


def get_full_repository_structure(repo, path=""):
    """
    Optimized structure discovery for LangGraph nodes.
    """
    return get_repository_structure(repo)


def get_file_content(repo, file_path, max_chars=12000):
    """
    Fetch file content with size bounding to avoid blowing token limits.
    """
    file = repo.get_contents(file_path)

    if isinstance(file, list):
        raise ValueError(f"{file_path} is a directory, not a file")

    content = file.decoded_content.decode("utf-8", errors="ignore")
    if len(content) > max_chars:
        content = content[:max_chars] + f"\n\n... [Truncated: {len(content) - max_chars} characters omitted for evaluation performance] ..."

    return content