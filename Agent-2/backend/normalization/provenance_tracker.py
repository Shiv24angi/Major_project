"""Source Provenance and Field-Level Audit Engine for Agent 2.

Maintains end-to-end traceability for every normalized field, recording:
- Originating source agent (Agent 1, Agent 6, External Research)
- Document or URL reference
- Evidence snippet or AST locator
- Confidence scores and extraction timestamps
- Granular NormalizedMetric tracking for scalar transformations.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from backend.models.output_schemas import NormalizedMetric, SourceProvenanceRecord


class ProvenanceTracker:
    def __init__(self):
        self.provenance_records: List[SourceProvenanceRecord] = []
        self.normalized_metrics: List[NormalizedMetric] = []

    def record_provenance(
        self,
        field_path: str,
        source_agent: str,
        document_or_url: Optional[str] = None,
        location: Optional[str] = None,
        evidence_snippet: Optional[str] = None,
        confidence_score: float = 0.85,
        extraction_timestamp: Optional[str] = None,
    ) -> SourceProvenanceRecord:
        """Add a field provenance record."""
        ts = extraction_timestamp or datetime.now(timezone.utc).isoformat()
        record = SourceProvenanceRecord(
            field_path=field_path,
            source_agent=source_agent,
            document_or_url=document_or_url,
            location=location,
            evidence_snippet=evidence_snippet,
            confidence_score=round(confidence_score, 2),
            extraction_timestamp=ts,
        )
        self.provenance_records.append(record)
        return record

    def record_metric(
        self,
        metric_name: str,
        original_value: Any,
        normalized_value: Any,
        source_agent: str,
        unit: Optional[str] = None,
        currency: Optional[str] = None,
        confidence: float = 0.85,
        validation_status: str = "valid",
        conflict_status: str = "none",
    ) -> NormalizedMetric:
        """Add a normalized scalar metric audit record."""
        metric = NormalizedMetric(
            metric_name=metric_name,
            original_value=original_value,
            normalized_value=normalized_value,
            unit=unit,
            currency=currency,
            confidence=round(confidence, 2),
            validation_status=validation_status,
            conflict_status=conflict_status,
            source_agent=source_agent,
        )
        self.normalized_metrics.append(metric)
        return metric

    def get_provenance_records(self) -> List[SourceProvenanceRecord]:
        return self.provenance_records

    def get_normalized_metrics(self) -> List[NormalizedMetric]:
        return self.normalized_metrics

