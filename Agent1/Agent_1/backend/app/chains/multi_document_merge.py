from app.llm.model import get_llm

from app.prompts.multi_document_merge import (
    multi_document_merge_prompt
)

from app.schemas.merged_analysis import (
    MergedStartupAnalysis
)


def get_multi_document_merge_chain():
    llm = get_llm()

    structured_llm = llm.with_structured_output(
        MergedStartupAnalysis
    )

    return (
        multi_document_merge_prompt
        | structured_llm
    )