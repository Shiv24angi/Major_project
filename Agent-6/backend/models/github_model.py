from pydantic import BaseModel
from typing import Optional, Dict, Any

class GitHubRequest(BaseModel):
    github_url: str

class RepoChatRequest(BaseModel):
    message: str
    github_url: Optional[str] = None
    run_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None