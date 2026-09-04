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


def select_important_files(structure):

    selected_files = []

    for item in structure:

        if item["type"] != "file":
            continue

        path = item["path"]

        # Ignore files inside unwanted directories
        parts = path.split("/")

        if any(part in IGNORED_DIRECTORIES for part in parts):
            continue

        filename = item["name"]

        # Always include important configuration files
        if filename in IMPORTANT_FILES:
            selected_files.append(path)
            continue

        # Include source-code files
        if "." in filename:
            extension = "." + filename.split(".")[-1]

            if extension in IMPORTANT_EXTENSIONS:
                selected_files.append(path)

    return selected_files