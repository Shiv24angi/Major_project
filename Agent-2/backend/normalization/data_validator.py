"""Data Validation Engine for Agent 2.

Performs domain-specific data integrity checks:
- Numeric range validation (gross margins, churn, runway, burn).
- Cross-metric consistency (ARR vs MRR x 12, SAM <= TAM, SOM <= SAM, LTV/CAC).
- Required and critical field completeness audits.
- Generates structured ValidationIssue and MissingFieldRecord lists.
"""

from typing import Any, Dict, List, Optional, Tuple

from backend.models.output_schemas import MissingFieldRecord, ValidationIssue


def validate_financial_metrics(
    arr: Optional[float],
    mrr: Optional[float],
    burn_rate: Optional[float],
    runway_months: Optional[float],
    gross_margin: Optional[float],
    churn_rate: Optional[float],
    cac: Optional[float],
    ltv: Optional[float],
) -> List[ValidationIssue]:
    """Audit financial metrics for plausible ranges and cross-metric consistency."""
    issues: List[ValidationIssue] = []

    # 1. ARR vs MRR Annualization check
    if arr is not None and mrr is not None and arr > 0:
        annualized_mrr = mrr * 12.0
        discrepancy = abs(arr - annualized_mrr) / arr
        if discrepancy > 0.20:
            issues.append(
                ValidationIssue(
                    field="financials.annual_recurring_revenue",
                    severity="warning",
                    rule="ARR_MRR_ANNUALIZATION_MISMATCH",
                    message=(
                        f"Reported ARR (${arr:,.2f}) deviates from annualized MRR "
                        f"(${annualized_mrr:,.2f}) by {discrepancy*100:.1f}%. Verify seasonal adjustments or one-off revenue."
                    ),
                    original_value={"arr": arr, "mrr": mrr, "annualized_mrr": annualized_mrr},
                    action_taken="flagged",
                )
            )

    # 2. Gross margin plausibility
    if gross_margin is not None:
        if gross_margin > 100.0:
            issues.append(
                ValidationIssue(
                    field="financials.gross_margin_percentage",
                    severity="error",
                    rule="MARGIN_EXCEEDS_100_PERCENT",
                    message=f"Gross margin of {gross_margin}% exceeds mathematical maximum of 100%.",
                    original_value=gross_margin,
                    action_taken="sanitized",
                )
            )
        elif gross_margin < 0.0:
            issues.append(
                ValidationIssue(
                    field="financials.gross_margin_percentage",
                    severity="warning",
                    rule="NEGATIVE_GROSS_MARGIN",
                    message=f"Negative gross margin detected ({gross_margin}%). Unit economics require subsidies.",
                    original_value=gross_margin,
                    action_taken="flagged",
                )
            )

    # 3. Churn rate sanity
    if churn_rate is not None:
        if churn_rate < 0.0:
            issues.append(
                ValidationIssue(
                    field="financials.churn_rate_percentage",
                    severity="error",
                    rule="NEGATIVE_CHURN_RATE",
                    message=f"Churn rate cannot be negative ({churn_rate}%).",
                    original_value=churn_rate,
                    action_taken="sanitized",
                )
            )
        elif churn_rate > 35.0:
            issues.append(
                ValidationIssue(
                    field="financials.churn_rate_percentage",
                    severity="warning",
                    rule="ELEVATED_CHURN_RATE",
                    message=f"High customer churn rate of {churn_rate}%. Poses retention and compounding growth risks.",
                    original_value=churn_rate,
                    action_taken="flagged",
                )
            )

    # 4. Runway vs Burn check
    if runway_months is not None:
        if runway_months < 0:
            issues.append(
                ValidationIssue(
                    field="financials.runway_months",
                    severity="error",
                    rule="NEGATIVE_RUNWAY",
                    message=f"Runway cannot be negative ({runway_months} months).",
                    original_value=runway_months,
                    action_taken="sanitized",
                )
            )
        elif runway_months < 3.0:
            issues.append(
                ValidationIssue(
                    field="financials.runway_months",
                    severity="warning",
                    rule="CRITICAL_CASH_RUNWAY",
                    message=f"Runway is critically short ({runway_months:.1f} months). Urgent fundraising or breakeven needed.",
                    original_value=runway_months,
                    action_taken="flagged",
                )
            )

    # 5. Unit Economics (LTV / CAC)
    if ltv is not None and cac is not None and cac > 0:
        ratio = ltv / cac
        if ratio < 1.0:
            issues.append(
                ValidationIssue(
                    field="financials.ltv_cac_ratio",
                    severity="warning",
                    rule="UNSUSTAINABLE_UNIT_ECONOMICS",
                    message=f"LTV to CAC ratio is {ratio:.2f}x (< 1.0x). Customer acquisition costs exceed lifetime customer value.",
                    original_value={"ltv": ltv, "cac": cac, "ratio": ratio},
                    action_taken="flagged",
                )
            )

    return issues


def validate_market_sizing(
    tam_usd: Optional[float],
    sam_usd: Optional[float],
    som_usd: Optional[float],
) -> List[ValidationIssue]:
    """Validate TAM >= SAM >= SOM hierarchy."""
    issues: List[ValidationIssue] = []

    if tam_usd is not None and sam_usd is not None:
        if sam_usd > tam_usd:
            issues.append(
                ValidationIssue(
                    field="market.sam_usd",
                    severity="error",
                    rule="SAM_EXCEEDS_TAM",
                    message=f"SAM (${sam_usd:,.0f}) cannot exceed TAM (${tam_usd:,.0f}).",
                    original_value={"tam": tam_usd, "sam": sam_usd},
                    action_taken="flagged",
                )
            )

    if sam_usd is not None and som_usd is not None:
        if som_usd > sam_usd:
            issues.append(
                ValidationIssue(
                    field="market.som_usd",
                    severity="error",
                    rule="SOM_EXCEEDS_SAM",
                    message=f"SOM (${som_usd:,.0f}) cannot exceed SAM (${sam_usd:,.0f}).",
                    original_value={"sam": sam_usd, "som": som_usd},
                    action_taken="flagged",
                )
            )

    if tam_usd is not None and som_usd is not None:
        if som_usd > tam_usd:
            issues.append(
                ValidationIssue(
                    field="market.som_usd",
                    severity="error",
                    rule="SOM_EXCEEDS_TAM",
                    message=f"SOM (${som_usd:,.0f}) cannot exceed TAM (${tam_usd:,.0f}).",
                    original_value={"tam": tam_usd, "som": som_usd},
                    action_taken="flagged",
                )
            )

    return issues


def audit_missing_fields(
    startup_name: Optional[str],
    description: Optional[str],
    industry: Optional[str],
    business_model: Optional[str],
    founders: List[Any],
    arr: Optional[float],
    burn_rate: Optional[float],
    runway_months: Optional[float],
    tam_usd: Optional[float],
    tech_stack: List[str],
    competitors: List[str],
) -> List[MissingFieldRecord]:
    """Audit profile for missing required and important fields, annotating downstream impact."""
    missing: List[MissingFieldRecord] = []

    # Critical fields (Agent 3 scoring blocker)
    if not startup_name:
        missing.append(
            MissingFieldRecord(
                field="startup_profile.canonical_name",
                category="startup_profile",
                importance="critical",
                description="Canonical startup name is absent.",
                downstream_impact="Prevents proper entity identification and evaluation scorecard generation in Agent 3.",
            )
        )

    if not description:
        missing.append(
            MissingFieldRecord(
                field="startup_profile.description",
                category="startup_profile",
                importance="critical",
                description="Startup summary and description missing.",
                downstream_impact="Agent 3 qualitative assessment cannot evaluate problem-solution alignment.",
            )
        )

    if not founders or len(founders) == 0:
        missing.append(
            MissingFieldRecord(
                field="team_information.founders",
                category="team",
                importance="critical",
                description="No founder profiles or leadership team members detected.",
                downstream_impact="Agent 3 Team Scoring sub-pillar will be heavily penalized.",
            )
        )

    # Important fields
    if not business_model:
        missing.append(
            MissingFieldRecord(
                field="business_information.business_model",
                category="business",
                importance="important",
                description="Business model type not explicitly stated.",
                downstream_impact="Agent 3 Unit Economics and Pricing evaluation will rely on generic defaults.",
            )
        )

    if arr is None and burn_rate is None and runway_months is None:
        missing.append(
            MissingFieldRecord(
                field="financial_information.financial_metrics",
                category="financials",
                importance="important",
                description="Core financial indicators (ARR, Burn, Runway) are absent.",
                downstream_impact="Agent 3 Financial Runway & Capital Efficiency score will default to unverified baseline.",
            )
        )

    if tam_usd is None:
        missing.append(
            MissingFieldRecord(
                field="market_information.tam_usd",
                category="market",
                importance="important",
                description="TAM market sizing estimate is missing.",
                downstream_impact="Agent 3 Market Potential score will lack quantitative benchmark.",
            )
        )

    if not tech_stack or len(tech_stack) == 0:
        missing.append(
            MissingFieldRecord(
                field="technical_information.tech_stack_standardized",
                category="technical",
                importance="important",
                description="Standardized technology stack is empty.",
                downstream_impact="Agent 3 Technical Feasibility & Scalability sub-pillar cannot be verified.",
            )
        )

    # Optional fields
    if not competitors or len(competitors) == 0:
        missing.append(
            MissingFieldRecord(
                field="business_information.competitors",
                category="business",
                importance="optional",
                description="Direct competitors list is empty.",
                downstream_impact="Agent 3 Competitive Moat analysis will depend exclusively on market research models.",
            )
        )

    return missing

