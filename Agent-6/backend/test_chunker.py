from services.agent6.chunker import chunk_file


content = """
This is a test source file.

Imagine this contains several thousand
characters of source code.

Agent 6 needs to process the file
without sending an enormous context window
to the LLM.
""" * 100


chunks = chunk_file(
    "example/src/main.js",
    content,
    max_chars=1000,
    overlap=100,
)


print("Total chunks:", len(chunks))

for chunk in chunks[:3]:

    print("\n--------------------")

    print("File:", chunk["file_path"])

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