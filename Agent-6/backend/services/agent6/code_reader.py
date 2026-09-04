from services.github_service import (
    get_repository,
    get_file_content
)


def read_selected_files(repository, selected_files):

    repo = get_repository(
        f"{repository['owner']}/{repository['name']}"
    )

    file_contents = {}

    for file_path in selected_files:

        try:

            content = get_file_content(
                repo,
                file_path
            )

            file_contents[file_path] = content

        except Exception as e:

            file_contents[file_path] = (
                f"ERROR READING FILE: {str(e)}"
            )

    return file_contents