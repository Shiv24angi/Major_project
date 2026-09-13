IMPORTANT_FILES = {
    "README.md",
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "setup.py",
    "Cargo.toml",
    "go.mod",
    "pom.xml",
    "build.gradle",
    "Dockerfile",
    "docker-compose.yml",
}


IMPORTANT_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".java",
    ".go",
    ".rs",
    ".cpp",
    ".c",
}


IGNORED_DIRECTORIES = {
    ".git",
    "node_modules",
    "__pycache__",
    "dist",
    "build",
    ".next",
    "coverage",
}


def select_important_files(structure, max_files=15):
    """
    Select a balanced, representative subset of key architectural files:
    1. Project manifests and configs (README, package.json, requirements.txt, Dockerfile)
    2. Primary entry points (main, app, index, server)
    3. Representative models and core logic
    Capped at max_files to ensure fast fetching and respect token limits.
    """
    priority_files = []
    scored_code_files = []

    for item in structure:
        if item.get("type") != "file":
            continue

        path = item.get("path", "")
        parts = path.split("/")

        # Ignore files inside unwanted directories
        if any(part in IGNORED_DIRECTORIES for part in parts):
            continue

        filename = item.get("name", "")

        # Always include important configuration files
        if filename in IMPORTANT_FILES:
            priority_files.append(path)
            continue

        # Include source-code files
        if "." in filename:
            extension = "." + filename.split(".")[-1]
            if extension in IMPORTANT_EXTENSIONS:
                score = 0
                lower_name = filename.lower()
                # Prioritize root/entry point files
                if any(k in lower_name for k in ["main", "app", "index", "server"]):
                    score += 10
                elif any(k in lower_name for k in ["route", "api", "model", "schema", "core"]):
                    score += 6
                elif any(k in lower_name for k in ["service", "controller", "util"]):
                    score += 4

                # Prefer shallower paths over deep nested files
                score += max(0, 5 - len(parts))

                scored_code_files.append((score, path))

    # Sort code files by score descending
    scored_code_files.sort(key=lambda x: x[0], reverse=True)

    # Combine priority files and top code files up to max_files
    selected_files = list(dict.fromkeys(priority_files))
    for _, code_path in scored_code_files:
        if len(selected_files) >= max_files:
            break
        if code_path not in selected_files:
            selected_files.append(code_path)

    return selected_files