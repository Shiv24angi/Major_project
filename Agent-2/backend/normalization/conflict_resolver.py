"""Conflict Detection and Resolution Engine for Agent 2.

Handles conflicting statements and metrics across Agent 1, Agent 6,
and External Research using deterministic source authority hierarchies,
recency arbitration, and confidence weighting.
"""

from typing import Any, Dict, List, Optional, Tuple

from backend.models.output_schemas import ConflictRecord


# Source Authority Hierarchy per Category
# Lower index = higher authority
CATEGORY_AUTHORITY: Dict[str, List[str]] = {
    "technical": ["agent6", "agent1", "external_research"],
    "technology": ["agent6", "agent1", "external_research"],
    "architecture": ["agent6", "agent1", "external_research"],
    "code_maturity": ["agent6", "agent1", "external_research"],
    "features": ["agent6", "agent1", "external_research"],
    "financials": ["external_research", "agent1", "agent6"],
    "funding": ["external_research", "agent1", "agent6"],
    "market_size": ["external_research", "agent1", "agent6"],
    "competitors": ["external_research", "agent1", "agent6"],
    "founders": ["agent1", "external_research", "agent6"],
    "business_model": ["agent1", "external_research", "agent6"],
}


class CandidateValue:
    def __init__(
        self,
        source: str,
        value: Any,
        confidence: float = 0.8,
        timestamp: Optional[str] = None,
        notes: Optional[str] = None,
    ):
        self.source = source
        self.value = value
        self.confidence = confidence
        self.timestamp = timestamp
        self.notes = notes

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source": self.source,
            "value": self.value,
            "confidence": self.confidence,
            "timestamp": self.timestamp,
            "notes": self.notes,
        }


def resolve_metric_conflict(
    field_name: str,
    category: str,
    candidates: List[CandidateValue],
    variance_threshold: float = 0.25,
) -> Tuple[Any, Optional[ConflictRecord]]:
    """Resolve conflicting candidates for a scalar or numeric metric.

    Returns:
        (resolved_value, conflict_record_or_none)
    """
    valid_candidates = [c for c in candidates if c.value is not None]
    if not valid_candidates:
        return None, None

    if len(valid_candidates) == 1:
        return valid_candidates[0].value, None

    # Check if all candidate values are identical
    distinct_values = set()
    for c in valid_candidates:
        if isinstance(c.value, (int, float)):
            distinct_values.add(round(float(c.value), 2))
        else:
            distinct_values.add(str(c.value).strip().lower())

    if len(distinct_values) == 1:
        return valid_candidates[0].value, None

    # Conflict exists between distinct candidate values
    candidates_dicts = [c.to_dict() for c in valid_candidates]
    authority_hierarchy = CATEGORY_AUTHORITY.get(category, ["agent1", "agent6", "external_research"])

    # Rule 1: Check Source Authority Priority
    source_to_candidate = {c.source: c for c in valid_candidates}
    for preferred_source in authority_hierarchy:
        if preferred_source in source_to_candidate:
            top_candidate = source_to_candidate[preferred_source]
            
            # Check numeric variance against other candidates
            is_numeric = isinstance(top_candidate.value, (int, float))
            large_variance = False
            if is_numeric:
                for c in valid_candidates:
                    if c.source != top_candidate.source and isinstance(c.value, (int, float)):
                        diff = abs(float(top_candidate.value) - float(c.value))
                        ref = max(abs(float(top_candidate.value)), 1.0)
                        if (diff / ref) > variance_threshold:
                            large_variance = True
                            break

            rationale = (
                f"Resolved using source authority: {preferred_source} is designated primary authority for {category}. "
                f"Selected value {top_candidate.value} over other candidate values."
            )
            if large_variance:
                rationale += f" Note: Material variance (> {int(variance_threshold*100)}%) detected across sources."

            conflict_record = ConflictRecord(
                field=field_name,
                category=category,
                candidates=candidates_dicts,
                resolved_value=top_candidate.value,
                resolution_policy="source_authority",
                resolution_rationale=rationale,
                is_resolved=True,
            )
            return top_candidate.value, conflict_record

    # Rule 2: Confidence-weighted tie-breaker
    sorted_by_conf = sorted(valid_candidates, key=lambda x: x.confidence, reverse=True)
    best = sorted_by_conf[0]
    conflict_record = ConflictRecord(
        field=field_name,
        category=category,
        candidates=candidates_dicts,
        resolved_value=best.value,
        resolution_policy="confidence_weighted",
        resolution_rationale=f"Selected candidate from {best.source} with highest confidence score ({best.confidence}).",
        is_resolved=True,
    )
    return best.value, conflict_record


def resolve_tech_claim_conflict(
    claim_text: str,
    pitch_deck_stated: bool,
    agent6_status: Optional[str],
    evidence_snippets: List[str],
) -> Tuple[str, Optional[ConflictRecord]]:
    """Resolve conflict between pitch deck marketing claims and codebase verification.

    Agent 6 status can be 'supported', 'inferred', or 'unknown' (unsupported).
    """
    if not pitch_deck_stated:
        return agent6_status or "unknown", None

    if agent6_status == "supported":
        return "supported", None

    # Pitch deck claims feature exists, but Agent 6 found no AST / code evidence
    if agent6_status in ("unknown", None) or not agent6_status:
        conflict = ConflictRecord(
            field="feature_claim_verification",
            category="technical",
            candidates=[
                {"source": "agent1", "value": f"Claimed: '{claim_text}'", "confidence": 0.8},
                {
                    "source": "agent6",
                    "value": "Unverified / Not found in repository AST",
                    "confidence": 0.95,
                    "evidence": evidence_snippets,
                },
            ],
            resolved_value="unsupported_claim",
            resolution_policy="source_authority",
            resolution_rationale=(
                f"Agent 6 static codebase analysis did not find supporting AST patterns or files for claim: "
                f"'{claim_text}'. Ground-truth repository analysis supersedes pitch deck assertion."
            ),
            is_resolved=True,
        )
        return "unsupported", conflict

    if agent6_status == "inferred":
        conflict = ConflictRecord(
            field="feature_claim_verification",
            category="technical",
            candidates=[
                {"source": "agent1", "value": f"Claimed: '{claim_text}'", "confidence": 0.8},
                {"source": "agent6", "value": "Inferred from dependencies/metadata", "confidence": 0.7},
            ],
            resolved_value="inferred",
            resolution_policy="source_authority",
            resolution_rationale=f"Partial code indicators found for '{claim_text}', marked as inferred.",
            is_resolved=True,
        )
        return "inferred", conflict

    return "unknown", None

