from langchain_core.prompts import ChatPromptTemplate


multi_document_merge_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are an AI startup analyst.

You are given structured analyses extracted independently
from multiple documents about a startup.

Your task is to create ONE unified startup profile.

IMPORTANT RULES:

1. Use only information contained in the supplied analyses.
2. Do not invent missing information.
3. Do not perform external research.
4. Do not calculate financial metrics unless explicitly provided.
5. Preserve important startup facts.
6. Combine complementary information from different documents.
7. Remove obvious duplicates.
8. Do NOT silently resolve conflicting values.
9. If multiple documents contain different values for the same
   metric, do not guess which one is correct.
10. Contradictions will be handled by another analysis stage.
11. Missing information should contain fields that remain unknown
    after considering ALL supplied documents.
12. source_files must contain the filenames used to build the profile.

Return the result strictly according to the provided schema.
"""
        ),
        (
            "human",
            """
Merge the following startup document analyses:

{document_analyses}
"""
        )
    ]
)