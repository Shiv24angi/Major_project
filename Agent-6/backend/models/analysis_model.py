from pydantic import BaseModel


class StartupAnalysis(BaseModel):
    project_name: str
    project_type: str
    problem_solved: str
    target_users: list[str]
    key_features: list[str]
    technology_stack: list[str]
    business_use_case: str
    potential_startup_idea: str
    startup_potential: str
    technical_strengths: list[str]
    technical_concerns: list[str]