"""Duplicate Detection and Consolidation Engine for Agent 2.

Identifies exact, case-insensitive, and fuzzy/semantic duplicates across
heterogeneous inputs from Agent 1, Agent 6, and External Research.
Generates structured DuplicateRecords for auditing and transparency.
"""

import re
from difflib import SequenceMatcher
from typing import Any, Dict, List, Set, Tuple

from backend.models.output_schemas import DuplicateRecord


def string_similarity(a: str, b: str) -> float:
    """Compute string similarity score between 0.0 and 1.0 using SequenceMatcher."""
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def clean_company_name(name: str) -> str:
    """Strip common legal/corporate suffixes for matching."""
    cleaned = re.sub(
        r"\b(inc|inc\.|llc|corp|corp\.|ltd|ltd\.|co\.|technologies|tech|ai|labs)\b",
        "",
        name,
        flags=re.IGNORECASE,
    )
    return re.sub(r"[^\w\s]", "", cleaned).strip().lower()


def deduplicate_string_list(
    items: List[str],
    field_name: str,
    source_agent: str = "unknown",
    similarity_threshold: float = 0.85,
) -> Tuple[List[str], List[DuplicateRecord]]:
    """Deduplicate a list of strings using exact and fuzzy matching.

    Returns:
        (unique_items, duplicate_records)
    """
    unique_items: List[str] = []
    duplicate_records: List[DuplicateRecord] = []

    for item in items:
        if not item or not str(item).strip():
            continue
        item_str = str(item).strip()

        is_dup = False
        for idx, existing in enumerate(unique_items):
            # Exact match (case insensitive)
            if item_str.lower() == existing.lower():
                is_dup = True
                duplicate_records.append(
                    DuplicateRecord(
                        field=field_name,
                        duplicate_value=item_str,
                        kept_value=existing,
                        source_agents=[source_agent],
                        similarity_score=1.0,
                        action="consolidated",
                    )
                )
                break

            # Fuzzy similarity match
            sim = string_similarity(item_str, existing)
            if sim >= similarity_threshold:
                is_dup = True
                duplicate_records.append(
                    DuplicateRecord(
                        field=field_name,
                        duplicate_value=item_str,
                        kept_value=existing,
                        source_agents=[source_agent],
                        similarity_score=round(sim, 2),
                        action="consolidated",
                    )
                )
                break

        if not is_dup:
            unique_items.append(item_str)

    return unique_items, duplicate_records


def deduplicate_competitors(
    competitor_lists: List[Tuple[List[str], str]],
    similarity_threshold: float = 0.82,
) -> Tuple[List[str], List[DuplicateRecord]]:
    """Merge and deduplicate competitors from multiple sources (Agent 1, External Research).

    Args:
        competitor_lists: List of (competitor_items, source_agent_name) tuples.
    """
    canonical_list: List[str] = []
    duplicate_records: List[DuplicateRecord] = []
    cleaned_map: Dict[str, str] = {}  # cleaned -> canonical

    for items, source in competitor_lists:
        for comp in items:
            if not comp or not str(comp).strip():
                continue
            comp_str = str(comp).strip()
            norm_key = clean_company_name(comp_str)

            matched_canonical = None
            highest_sim = 0.0

            # Direct stripped match
            if norm_key in cleaned_map:
                matched_canonical = cleaned_map[norm_key]
                highest_sim = 1.0
            else:
                # Fuzzy match
                for existing in canonical_list:
                    sim = string_similarity(comp_str, existing)
                    if sim > highest_sim and sim >= similarity_threshold:
                        highest_sim = sim
                        matched_canonical = existing

            if matched_canonical:
                duplicate_records.append(
                    DuplicateRecord(
                        field="competitors",
                        duplicate_value=comp_str,
                        kept_value=matched_canonical,
                        source_agents=[source],
                        similarity_score=round(highest_sim, 2),
                        action="consolidated",
                    )
                )
            else:
                canonical_list.append(comp_str)
                cleaned_map[norm_key] = comp_str

    return canonical_list, duplicate_records


def deduplicate_founders(
    founders_list: List[Dict[str, Any]],
    source_agent: str = "agent1",
) -> Tuple[List[Dict[str, Any]], List[DuplicateRecord]]:
    """Deduplicate founder entries by person name."""
    unique_founders: List[Dict[str, Any]] = []
    seen_names: Set[str] = set()
    duplicate_records: List[DuplicateRecord] = []

    for f in founders_list:
        name = str(f.get("name", "")).strip()
        if not name or name.lower() in ("unknown", "n/a", "none"):
            continue

        name_lower = name.lower()
        if name_lower in seen_names:
            duplicate_records.append(
                DuplicateRecord(
                    field="founders",
                    duplicate_value=f,
                    kept_value=name,
                    source_agents=[source_agent],
                    similarity_score=1.0,
                    action="consolidated",
                )
            )
        else:
            seen_names.add(name_lower)
            unique_founders.append(f)

    return unique_founders, duplicate_records

