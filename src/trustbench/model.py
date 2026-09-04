from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal

FindingStatus = Literal["pass", "divergence", "limitation", "failure"]
Severity = Literal["info", "low", "medium", "high", "critical"]


@dataclass(frozen=True, slots=True)
class Finding:
    id: str
    title: str
    area: str
    status: FindingStatus
    severity: Severity
    claim: str
    observed: Any
    reference: Any
    evidence: str
    recommendation: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class VerificationReport:
    subject: str
    subject_path: str
    subject_sha256: str
    generated_at_utc: str
    environment: dict[str, str]
    methodology_version: str
    findings: list[Finding] = field(default_factory=list)
    elapsed_seconds: float = 0.0

    @property
    def counts(self) -> dict[str, int]:
        values = {"pass": 0, "divergence": 0, "limitation": 0, "failure": 0}
        for finding in self.findings:
            values[finding.status] += 1
        return values

    @property
    def high_priority_count(self) -> int:
        return sum(
            finding.severity in {"high", "critical"}
            and finding.status != "pass"
            for finding in self.findings
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "schema_version": "trustbench.report.v1",
            "subject": self.subject,
            "subject_path": self.subject_path,
            "subject_sha256": self.subject_sha256,
            "generated_at_utc": self.generated_at_utc,
            "environment": self.environment,
            "methodology_version": self.methodology_version,
            "elapsed_seconds": self.elapsed_seconds,
            "summary": {
                **self.counts,
                "high_priority_non_pass": self.high_priority_count,
                "total": len(self.findings),
            },
            "findings": [finding.to_dict() for finding in self.findings],
        }
