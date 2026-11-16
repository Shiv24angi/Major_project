"""Due Diligence Questions Generator for Agent 4.

Generates sharp, institutional due diligence inquiries for investment committees.
"""

import uuid
from typing import Any, Dict, List
from models.recommendation_models import DueDiligenceQuestion


def generate_due_diligence_questions(
    startup_name: str,
    scores: Dict[str, int],
    normalized_data: Dict[str, Any],
) -> List[DueDiligenceQuestion]:
    """Produces categorized diligence questions mapped to key vulnerability points."""
    fin = normalized_data.get("financial_information") or {}
    tech = normalized_data.get("technical_information") or {}
    conflicts = normalized_data.get("conflicts") or []

    questions: List[DueDiligenceQuestion] = []

    # 1. Technical Architecture Question
    code_maturity = (tech.get("code_maturity_rating") or "moderate").lower()
    questions.append(
        DueDiligenceQuestion(
            id=f"dd_{uuid.uuid4().hex[:8]}",
            category="Technical & Architecture",
            question=f"What is your automated test coverage percentage and Disaster Recovery strategy across core production services?",
            whyItMatters=f"Agent 6 Code AST identified '{code_maturity}' maturity. Enterprise deployments require fault-tolerant failovers and reproducible CI/CD.",
            suggestedValidation="Request SOC2 compliance roadmap, test suite code coverage reports, and architecture diagrams.",
        )
    )

    # 2. Unit Economics & Retention Question
    churn = fin.get("churn_rate_percentage")
    ltv_cac = fin.get("ltv_cac_ratio")
    questions.append(
        DueDiligenceQuestion(
            id=f"dd_{uuid.uuid4().hex[:8]}",
            category="Unit Economics & Financials",
            question="What is your net revenue retention (NRR) rate and average customer payback period by acquisition channel?",
            whyItMatters="High top-line growth is unsustainable if cohort churn masks low net expansion velocity.",
            suggestedValidation="Inspect cohort-level retention waterfalls across the trailing 12 months.",
        )
    )

    # 3. Moat & Defensibility Question
    questions.append(
        DueDiligenceQuestion(
            id=f"dd_{uuid.uuid4().hex[:8]}",
            category="Product & Moat",
            question=f"What prevents established incumbents or open-source alternatives from replicating your core capabilities within 6 months?",
            whyItMatters="Technical differentiation must be reinforced by proprietary data flywheels, workflow switching costs, or network effects.",
            suggestedValidation="Examine proprietary IP filings, proprietary dataset ownership, and customer integration lock-in metrics.",
        )
    )

    # 4. Conflict Resolution (if conflicts exist)
    if conflicts:
        c_field = conflicts[0].get("field", "metrics")
        questions.append(
            DueDiligenceQuestion(
                id=f"dd_{uuid.uuid4().hex[:8]}",
                category="Audited Data Integrity",
                question=f"Can you provide secondary reconciliation for {c_field} as presented in the pitch deck versus codebase inspection?",
                whyItMatters="Cross-source reconciliation discrepancies must be cleared prior to final term sheet execution.",
                suggestedValidation="Request raw bank statements, stripe dashboard export, or source contract agreements.",
            )
        )
    else:
        questions.append(
            DueDiligenceQuestion(
                id=f"dd_{uuid.uuid4().hex[:8]}",
                category="Sales & GTM Velocity",
                question="What is the average sales cycle length from initial discovery call to signed enterprise contract?",
                whyItMatters="Sales cycle predictability dictates quarterly cash burn and runway planning.",
                suggestedValidation="Review CRM pipeline conversion velocity and contract duration distributions.",
            )
        )

    # 5. Governance & Team
    questions.append(
        DueDiligenceQuestion(
            id=f"dd_{uuid.uuid4().hex[:8]}",
            category="Governance & Equity",
            question="Are all founders and key contributors subject to standard 4-year equity vesting schedules with a 1-year cliff?",
            whyItMatters="Founder alignment and unvested equity clawbacks protect the syndicate from early departure risks.",
            suggestedValidation="Review cap table, founder stock purchase agreements, and IP assignment contracts.",
        )
    )

    return questions
