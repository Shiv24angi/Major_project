import sys

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from services.agent6.graph import agent6_graph


# Allow dynamic GitHub repository URL via command line argument, with fallback
target_github_url = sys.argv[1] if len(sys.argv) > 1 else "https://github.com/vanshaggarwal27/EN2H_assignment"
print(f"[AGENT-6] Executing pipeline for repository: {target_github_url}")

result = agent6_graph.invoke({
    "github_url": target_github_url
})


print("\n========== AGENT 6 ==========")

print(
    "Repository:",
    result.get("repository")
)

print(
    "Files discovered:",
    len(result.get("files", []))
)

print(
    "Files selected:",
    len(result.get("selected_files", []))
)

print(
    "Files read:",
    len(result.get("file_contents", {}))
)

print(
    "Chunks created:",
    len(result.get("chunks", []))
)


print("\n========== FIRST 5 CHUNKS ==========")

for chunk in result.get("chunks", [])[:5]:

    print("\n--------------------")

    print(
        "File:",
        chunk["file_path"]
    )

    print(
        "Chunk:",
        chunk["chunk_index"],
        "/",
        chunk["total_chunks"]
    )

    print(
        "Characters:",
        len(chunk["content"])
    )


print("\n========== AGENT 6 -> AGENT 2 STORAGE HANDOFF ==========")
print("Run ID:", result.get("run_id"))
print("Saved File Path:", result.get("stored_file_path"))
print("Validated Findings Count:", len(result.get("findings", [])))
print("Ready for Agent 2 consumption: YES")
