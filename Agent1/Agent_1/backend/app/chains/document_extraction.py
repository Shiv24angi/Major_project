from app.llm.model import get_llm
from app.prompts.document_analysis import document_analysis_prompt
from app.schemas.startup_analysis import StartupAnalysis


def get_document_extraction_chain():
    llm = get_llm()

    structured_llm = llm.with_structured_output(
        StartupAnalysis
    )

    chain = document_analysis_prompt | structured_llm

    return chain