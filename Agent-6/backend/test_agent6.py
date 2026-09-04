from services.agent6.graph import agent6_graph


result = agent6_graph.invoke({
    "github_url": "https://github.com/Shiv24angi/EcoVerse"
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