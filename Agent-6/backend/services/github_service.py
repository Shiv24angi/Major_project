import os

from github import Github
from dotenv import load_dotenv

load_dotenv()

github_token = os.getenv("GITHUB_TOKEN")

if github_token:
    g = Github(github_token)
else:
    g = Github()


def get_repository(repo_name: str):
    repo = g.get_repo(repo_name)

    return repo


def get_readme(repo):
    readme = repo.get_readme()

    content = readme.decoded_content.decode("utf-8")

    return content


def get_repository_structure(repo):
    """
    Recursively discover files and directories in the repository.

    Returns a flat list of repository entries:

    [
        {
            "name": "...",
            "path": "...",
            "type": "file"
        }
    ]

    The function walks through nested directories so Agent 6
    can inspect the actual codebase rather than only root files.
    """

    all_items = []

    def walk(path=""):
        try:
            contents = repo.get_contents(path)

        except Exception as e:
            print(
                f"Could not read repository path "
                f"'{path}': {e}"
            )
            return

        for item in contents:

            entry = {
                "name": item.name,
                "path": item.path,
                "type": item.type
            }

            all_items.append(entry)

            # Recursively inspect directories
            if item.type == "dir":
                walk(item.path)

    walk()

    return all_items


def get_file_content(repo, file_path):
    file = repo.get_contents(file_path)

    if isinstance(file, list):
        raise ValueError(f"{file_path} is a directory, not a file")

    return file.decoded_content.decode("utf-8")


def get_full_repository_structure(repo, path=""):
    """
    Recursively discover files and directories in a GitHub repository.
    """

    contents = repo.get_contents(path)

    structure = []

    for item in contents:

        entry = {
            "name": item.name,
            "path": item.path,
            "type": item.type
        }

        structure.append(entry)

        # Recursively inspect directories
        if item.type == "dir":
            try:
                children = get_full_repository_structure(
                    repo,
                    item.path
                )

                structure.extend(children)

            except Exception as e:
                print(
                    f"Could not inspect directory "
                    f"{item.path}: {str(e)}"
                )

    return structure