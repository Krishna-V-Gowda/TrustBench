from __future__ import annotations

from trustbench.model import Finding, VerificationReport
from trustbench.reporting import render_markdown


def _report(findings: list[Finding]) -> VerificationReport:
    return VerificationReport(
        subject="subject",
        subject_path="subject.js",
        subject_sha256="0" * 64,
        generated_at_utc="2026-09-03T00:00:00Z",
        environment={"python": "test"},
        methodology_version="test",
        findings=findings,
    )


def test_executive_summary_tracks_a_low_severity_limitation() -> None:
    report = _report([
        Finding(
            id="TB-X-001",
            title="Configurable token vocabulary",
            area="data semantics",
            status="limitation",
            severity="low",
            claim="claim",
            observed={},
            reference={},
            evidence="evidence",
            recommendation="recommendation",
        )
    ])
    markdown = render_markdown(report)
    assert "no high-priority non-pass findings" in markdown.lower()
    assert "TB-X-001 (limitation): Configurable token vocabulary" in markdown
    assert "high-cardinality categorical association" not in markdown


def test_executive_summary_surfaces_high_priority_failures() -> None:
    report = _report([
        Finding(
            id="TB-X-002",
            title="Permutation instability",
            area="association",
            status="failure",
            severity="high",
            claim="claim",
            observed={},
            reference={},
            evidence="evidence",
            recommendation="recommendation",
        )
    ])
    markdown = render_markdown(report)
    assert "High-priority remediation is concentrated" in markdown
    assert "TB-X-002 (association): Permutation instability" in markdown
