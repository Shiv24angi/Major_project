"""
Agent 6 repository file selector.

Purpose:
    Select a small but representative set of files from a potentially
    very large GitHub repository.

The selector intentionally prioritizes:
    1. Project metadata/documentation
    2. Core source code
    3. Important architectural packages
    4. Configuration/build files
    5. Supporting source code

It intentionally avoids:
    - node_modules
    - generated files
    - fixtures
    - test fixtures
    - examples
    - DevTools demo applications
    - benchmark files
"""


SOURCE_EXTENSIONS = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".java",
    ".kt",
    ".go",
    ".rs",
    ".c",
    ".cc",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".rb",
    ".php",
    ".swift",
    ".dart",
    ".vue",
    ".svelte",
}


IGNORE_DIRECTORY_NAMES = {
    ".git",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    "dist",
    "build",
    "coverage",
    ".next",
    ".cache",
}


LOW_VALUE_PATH_PARTS = {
    "__tests__",
    "fixtures",
    "fixture",
    "examples",
    "example",
    "benchmarks",
    "benchmark",
}


# ---------------------------------------------------------
# Files that give Agent 6 high-level project information
# ---------------------------------------------------------

ROOT_PRIORITY_FILES = [
    "README.md",
    "package.json",
    "pyproject.toml",
    "requirements.txt",
    "requirements-dev.txt",
    "Cargo.toml",
    "go.mod",
    "pom.xml",
    "build.gradle",
    ".nvmrc",
    "Dockerfile",
]


CONFIG_FILES = {
    "babel.config.js",
    "babel.config.ts",
    "babel.config-react-compiler.js",
    "babel.config-ts.js",
    "tsconfig.json",
    "webpack.config.js",
    "vite.config.js",
    "vite.config.ts",
    "rollup.config.js",
    ".eslintrc.js",
    ".prettierrc.js",
    "jest.config.js",
}


# ---------------------------------------------------------
# React-specific architectural areas
#
# This is important for the React repository, because
# "packages/*" contains many unrelated packages.
# ---------------------------------------------------------

REACT_CORE_PREFIXES = [
    "packages/react/",
    "packages/react-dom/",
    "packages/react-reconciler/",
    "packages/scheduler/",
    "packages/shared/",
    "packages/react-server/",
    "packages/react-is/",
]


REACT_SECONDARY_PREFIXES = [
    "packages/react-art/",
    "packages/react-refresh/",
    "packages/react-test-renderer/",
    "packages/react-client/",
    "packages/react-server-dom-",
]


# Explicitly avoid these when selecting the initial
# implementation sample.

REACT_LOW_PRIORITY_PREFIXES = [
    "packages/react-devtools-",
    "packages/react-native-renderer/",
    "packages/react-art/",
]


def normalize_path(path):
    """
    Normalize Windows/Linux path separators.
    """

    return path.replace("\\", "/").strip("/")


def is_file(item):
    """
    Return True only for repository files.
    """

    return item.get("type") == "file"


def has_ignored_directory(path):
    """
    Check for directories that should never be investigated.
    """

    parts = normalize_path(path).split("/")

    for part in parts:

        if part in IGNORE_DIRECTORY_NAMES:
            return True

    return False


def is_low_value_path(path):
    """
    Detect tests, fixtures, examples and benchmarks.

    These are useful later, but they are not what we want
    in Agent 6's first architectural investigation.
    """

    normalized = normalize_path(path)

    parts = normalized.lower().split("/")

    for part in parts:

        if part in LOW_VALUE_PATH_PARTS:
            return True

    return False


def is_source_file(path):
    """
    Check whether the path looks like source code.
    """

    path = normalize_path(path)

    filename = path.split("/")[-1]

    if "." not in filename:
        return False

    extension = "." + filename.rsplit(".", 1)[-1].lower()

    return extension in SOURCE_EXTENSIONS


def is_root_file(path):
    """
    Check whether a file is directly in the repository root.
    """

    return "/" not in normalize_path(path)


def is_react_core_file(path):
    """
    Check whether the file belongs to one of React's
    core architectural packages.
    """

    path = normalize_path(path)

    for prefix in REACT_CORE_PREFIXES:

        if path.startswith(prefix):

            # Don't accidentally include tests/fixtures
            if is_low_value_path(path):
                return False

            return True

    return False


def is_react_secondary_file(path):
    """
    Check secondary React packages.
    """

    path = normalize_path(path)

    for prefix in REACT_SECONDARY_PREFIXES:

        if path.startswith(prefix):

            if is_low_value_path(path):
                return False

            return True

    return False


def is_react_low_priority_file(path):
    """
    Detect React DevTools/demo-oriented code.
    """

    path = normalize_path(path)

    for prefix in REACT_LOW_PRIORITY_PREFIXES:

        if path.startswith(prefix):

            return True

    return False


def select_important_files(files, max_files=15):
    """
    Select a representative repository sample.

    IMPORTANT:
        This function does not attempt to read the entire
        repository.

        Agent 6 will eventually investigate additional
        files iteratively.

    For the initial pass we want breadth + architecture,
    not random/high-scoring files.
    """

    # -----------------------------------------------------
    # Normalize input
    # -----------------------------------------------------

    normalized_files = []

    for item in files:

        if not is_file(item):
            continue

        path = normalize_path(
            item.get("path", "")
        )

        if not path:
            continue

        if has_ignored_directory(path):
            continue

        normalized_files.append({
            "name": item.get("name", path.split("/")[-1]),
            "path": path,
            "type": "file",
        })

    # -----------------------------------------------------
    # Avoid duplicates
    # -----------------------------------------------------

    by_path = {}

    for item in normalized_files:

        by_path[item["path"]] = item

    normalized_files = list(
        by_path.values()
    )

    selected = []
    selected_paths = set()

    def add(path):
        """
        Add a path if it has not already been selected.
        """

        if len(selected) >= max_files:
            return False

        if path in selected_paths:
            return False

        selected.append(path)
        selected_paths.add(path)

        return True

    # =====================================================
    # STEP 1
    # Repository-level understanding
    # =====================================================

    for filename in ROOT_PRIORITY_FILES:

        if len(selected) >= max_files:
            break

        for item in normalized_files:

            path = item["path"]

            if (
                is_root_file(path)
                and item["name"] == filename
            ):

                add(path)
                break

    # =====================================================
    # STEP 2
    # React core implementation
    #
    # One or two files from each major subsystem.
    # =====================================================

    for prefix in REACT_CORE_PREFIXES:

        if len(selected) >= max_files:
            break

        candidates = []

        for item in normalized_files:

            path = item["path"]

            if path in selected_paths:
                continue

            if not path.startswith(prefix):
                continue

            if not is_source_file(path):
                continue

            if is_low_value_path(path):
                continue

            candidates.append(item)

        # Prefer files directly inside src directories.
        candidates.sort(
            key=lambda item: (
                0 if "/src/" in item["path"] else 1,
                item["path"].count("/"),
                item["path"],
            )
        )

        if candidates:

            add(candidates[0]["path"])

    # =====================================================
    # STEP 3
    # Get additional core implementation files.
    #
    # This gives Agent 6 enough code to understand
    # relationships between major components.
    # =====================================================

    core_candidates = []

    for item in normalized_files:

        path = item["path"]

        if path in selected_paths:
            continue

        if not is_react_core_file(path):
            continue

        if not is_source_file(path):
            continue

        core_candidates.append(item)

    core_candidates.sort(
        key=lambda item: (
            0 if "/src/" in item["path"] else 1,
            item["path"].count("/"),
            item["path"],
        )
    )

    for item in core_candidates:

        if len(selected) >= max_files:
            break

        add(item["path"])

    # =====================================================
    # STEP 4
    # React compiler implementation
    #
    # NOT compiler tests.
    # =====================================================

    compiler_candidates = []

    for item in normalized_files:

        path = item["path"]

        if path in selected_paths:
            continue

        if not path.startswith("compiler/"):
            continue

        if not is_source_file(path):
            continue

        if is_low_value_path(path):
            continue

        compiler_candidates.append(item)

    compiler_candidates.sort(
        key=lambda item: (
            0 if "/src/" in item["path"] else 1,
            item["path"].count("/"),
            item["path"],
        )
    )

    for item in compiler_candidates:

        if len(selected) >= max_files:
            break

        add(item["path"])

    # =====================================================
    # STEP 5
    # Important configuration files
    # =====================================================

    for item in normalized_files:

        if len(selected) >= max_files:
            break

        path = item["path"]

        if path in selected_paths:
            continue

        if not is_root_file(path):
            continue

        if item["name"] not in CONFIG_FILES:
            continue

        add(path)

    # =====================================================
    # STEP 6
    # Secondary implementation
    # =====================================================

    secondary_candidates = []

    for item in normalized_files:

        path = item["path"]

        if path in selected_paths:
            continue

        if not is_react_secondary_file(path):
            continue

        if not is_source_file(path):
            continue

        if is_low_value_path(path):
            continue

        secondary_candidates.append(item)

    secondary_candidates.sort(
        key=lambda item: (
            item["path"].count("/"),
            item["path"],
        )
    )

    for item in secondary_candidates:

        if len(selected) >= max_files:
            break

        add(item["path"])

    # =====================================================
    # STEP 7
    # Generic source fallback
    # =====================================================

    fallback_candidates = []

    for item in normalized_files:

        path = item["path"]

        if path in selected_paths:
            continue

        if not is_source_file(path):
            continue

        if is_low_value_path(path):
            continue

        if is_react_low_priority_file(path):
            continue

        fallback_candidates.append(item)

    fallback_candidates.sort(
        key=lambda item: (
            item["path"].count("/"),
            item["path"],
        )
    )

    for item in fallback_candidates:

        if len(selected) >= max_files:
            break

        add(item["path"])

    # =====================================================
    # STEP 8
    # Last-resort fallback
    # =====================================================

    for item in normalized_files:

        if len(selected) >= max_files:
            break

        add(item["path"])

    return selected[:max_files]