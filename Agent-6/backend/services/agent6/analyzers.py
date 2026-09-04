from pydantic import BaseModel, Field
from typing import List, Literal


class Finding(BaseModel):
    category: str = Field(
        description="Category of the finding"
    )

    claim: str = Field(
        description="Evidence-based claim"
    )

    status: Literal[
        "supported",
        "inferred",
        "unknown"
    ] = Field(
        description="Whether the claim is supported, inferred, or unknown"
    )

    evidence: List[str] = Field(
        default_factory=list,
        description="Repository files or repository facts supporting the claim"
    )


class RepositoryAnalysis(BaseModel):

    findings: List[Finding] = Field(
        default_factory=list,
        description="Evidence-backed findings about the repository"
    )