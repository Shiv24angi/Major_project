def build_agent6_context(
    owner,
    repository,
    readme,
    structure,
    selected_files,
    file_contents
):
    return {
        "repository": {
            "owner": owner,
            "name": repository
        },

        "readme": readme,

        "repository_structure": structure,

        "selected_files": selected_files,

        "file_contents": file_contents
    }