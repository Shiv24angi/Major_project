from typing import List

from pydantic import BaseModel, Field


class Evidence(BaseModel):
    file: str = Field(
        description="Repository file that supports the conclusion"
    )
    reason: str = Field(
        description="Why this file supports the conclusion"
    )


class Finding(BaseModel):
    category: str = Field(
        description=(
            "Category of the finding: "
            "project, problem, feature, technology, architecture, "
            "database, api, maturity, security, scalability, "
            "code_quality, market, monetization, or risk"
        )
    )

    claim: str = Field(
        description="Evidence-based conclusion about the repository"
    )

    status: str = Field(
        description="supported, inferred, or unknown"
    )

    evidence: List[Evidence] = Field(
        default_factory=list,
        description="Repository evidence supporting the conclusion"
    )


class ScoredAssessment(BaseModel):
    score: float = Field(
        ge=0,
        le=10,
        description="Score from 0 to 10"
    )

    assessment: str = Field(
        description="Explanation of why this score was given"
    )

    evidence: List[Evidence] = Field(
        default_factory=list,
        description="Evidence supporting the assessment"
    )


class ProjectAssessment(BaseModel):
    name: str
    type: str
    purpose: str

    evidence: List[Evidence] = Field(
        default_factory=list
    )


class ProblemAssessment(BaseModel):
    summary: str

    capabilities: List[str] = Field(
        default_factory=list
    )

    evidence: List[Evidence] = Field(
        default_factory=list
    )


class Feature(BaseModel):
    name: str
    description: str

    evidence: List[Evidence] = Field(
        default_factory=list
    )


class Technology(BaseModel):
    name: str
    purpose: str

    evidence: List[Evidence] = Field(
        default_factory=list
    )


class ArchitectureAssessment(BaseModel):
    style: str

    modules: List[str] = Field(
        default_factory=list
    )

    data_flow: str

    observations: List[str] = Field(
        default_factory=list
    )

    evidence: List[Evidence] = Field(
        default_factory=list
    )


class DatabaseAssessment(BaseModel):
    entities: List[str] = Field(
        default_factory=list
    )

    relationships: List[str] = Field(
        default_factory=list
    )

    indexes: List[str] = Field(
        default_factory=list
    )

    constraints: List[str] = Field(
        default_factory=list
    )

    important_fields: List[str] = Field(
        default_factory=list
    )

    evidence: List[Evidence] = Field(
        default_factory=list
    )


class APIEndpoint(BaseModel):
    method: str
    path: str
    description: str
    authentication: str

    evidence: List[Evidence] = Field(
        default_factory=list
    )


class APIAssessment(BaseModel):
    endpoints: List[APIEndpoint] = Field(
        default_factory=list
    )

    authentication: List[str] = Field(
        default_factory=list
    )

    public_endpoints: List[str] = Field(
        default_factory=list
    )

    protected_endpoints: List[str] = Field(
        default_factory=list
    )

    validation: List[str] = Field(
        default_factory=list
    )

    error_handling: List[str] = Field(
        default_factory=list
    )

    evidence: List[Evidence] = Field(
        default_factory=list
    )


class TechnicalMaturityAssessment(BaseModel):
    testing: str
    documentation: str
    dockerization: str
    error_handling: str
    configuration_management: str
    code_organization: str
    production_readiness: str

    evidence: List[Evidence] = Field(
        default_factory=list
    )


class SecurityAssessment(BaseModel):
    jwt: str
    password_hashing: str
    validation: str
    authentication_guards: str
    secrets_configuration: str
    hardcoded_credentials: str
    authorization_gaps: str
    api_exposure: str

    evidence: List[Evidence] = Field(
        default_factory=list
    )


class ScalabilityAssessment(BaseModel):
    database_architecture: str
    stateless_api: str
    pagination: str

    caching_opportunities: List[str] = Field(
        default_factory=list
    )

    bottlenecks: List[str] = Field(
        default_factory=list
    )

    horizontal_scaling_readiness: str

    evidence: List[Evidence] = Field(
        default_factory=list
    )


class CodeQualityAssessment(BaseModel):
    modularity: str
    separation_of_concerns: str
    dto_usage: str
    exception_handling: str
    testing: str
    maintainability: str

    technical_debt: List[str] = Field(
        default_factory=list
    )

    evidence: List[Evidence] = Field(
        default_factory=list
    )


class MarketAssessment(BaseModel):
    problem: str

    target_customers: List[str] = Field(
        default_factory=list
    )

    differentiation: List[str] = Field(
        default_factory=list
    )

    potential_use_cases: List[str] = Field(
        default_factory=list
    )

    adoption_potential: str

    evidence: List[Evidence] = Field(
        default_factory=list
    )


class MonetizationModel(BaseModel):
    model: str
    rationale: str
    status: str

    evidence: List[Evidence] = Field(
        default_factory=list
    )


class MonetizationAssessment(BaseModel):
    possibilities: List[MonetizationModel] = Field(
        default_factory=list
    )


class Risk(BaseModel):
    type: str
    risk: str
    severity: str

    evidence: List[Evidence] = Field(
        default_factory=list
    )


class FinalProjectAssessment(BaseModel):
    technical_maturity: ScoredAssessment
    scalability: ScoredAssessment
    security: ScoredAssessment
    code_quality: ScoredAssessment
    market_potential: ScoredAssessment
    monetization_potential: ScoredAssessment

    overall_assessment: str


class RepositoryAnalysis(BaseModel):
    project: ProjectAssessment

    problem: ProblemAssessment

    features: List[Feature] = Field(
        default_factory=list
    )

    tech_stack: List[Technology] = Field(
        default_factory=list
    )

    architecture: ArchitectureAssessment

    database: DatabaseAssessment

    api_analysis: APIAssessment

    technical_maturity: TechnicalMaturityAssessment

    security: SecurityAssessment

    scalability: ScalabilityAssessment

    code_quality: CodeQualityAssessment

    market_potential: MarketAssessment

    monetization: MonetizationAssessment

    risks: List[Risk] = Field(
        default_factory=list
    )

    final_project_assessment: FinalProjectAssessment


def validate_analysis(data: dict) -> RepositoryAnalysis:
    """
    Validate the structured Agent 6 analysis.

    This gives Agent 6 a strict output contract before
    handing the result to the next agent.
    """
    return RepositoryAnalysis.model_validate(data)