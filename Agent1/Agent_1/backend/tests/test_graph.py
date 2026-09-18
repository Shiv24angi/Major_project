import json

from app.graph.workflow import agent1_graph


initial_state = {
    "file_path": "uploads/00b8aac6-d5b9-42d6-be45-81d8f8cfcd2a.docx",

    "document_type": None,
    "document_text": None,
    "metadata": None,
    "extracted_data": None,
    "validation_errors": [],
    "retry_count": 0,
    "status": "started",
}


result = agent1_graph.invoke(initial_state)


print("\n==============================")
print("AGENT 1 RESULT")
print("==============================")

print("Status:", result.get("status"))
print("Document Type:", result.get("document_type"))
print("Retry Count:", result.get("retry_count"))
print("Validation Errors:", result.get("validation_errors"))

print("\n==============================")
print("EXTRACTED STARTUP DATA")
print("==============================")

print(
    json.dumps(
        result.get("extracted_data"),
        indent=2,
        ensure_ascii=False,
        default=str
    )
)

with open(
    "tests/agent1_output.json",
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        result,
        f,
        indent=2,
        ensure_ascii=False,
        default=str
    )


print("\nFull output saved to:")
print("tests/agent1_output.json")