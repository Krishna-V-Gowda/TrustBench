from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .model import Finding, VerificationReport

STATUS_LABEL = {
    "pass": "PASS",
    "divergence": "DEFINITION DIVERGENCE",
    "limitation": "LIMITATION",
    "failure": "FAILED INVARIANT",
}


def write_json(report: VerificationReport, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(report.to_dict(), indent=2, sort_keys=False) + "\n",
        encoding="utf-8",
    )


def _render_value(value: Any) -> str:
    if isinstance(value, str):
        return value
    return "```json\n" + json.dumps(value, indent=2, sort_keys=True) + "\n```"


def _finding_section(finding: Finding) -> str:
    return f"""### {finding.id} — {finding.title}

**Classification:** {STATUS_LABEL[finding.status]} · **Severity:** {finding.severity.upper()} · **Area:** {finding.area}

**Invariant / claim tested.** {finding.claim}

**Observed.**

{_render_value(finding.observed)}

**Reference.**

{_render_value(finding.reference)}

**Evidence.** {finding.evidence}

**Recommended engineering action.** {finding.recommendation}
"""


def _executive_interpretation(report: VerificationReport) -> str:
    counts = report.counts
    non_pass = [finding for finding in report.findings if finding.status != "pass"]
    if not non_pass:
        return (
            "Every exercised case passed. This establishes agreement only for the "
            "declared definitions and fixtures; the interpretation boundaries below "
            "still apply."
        )

    high_priority = [
        finding
        for finding in non_pass
        if finding.severity in {"high", "critical"}
    ]
    if high_priority:
        focus = "; ".join(
            f"{finding.id} ({finding.area}): {finding.title}"
            for finding in high_priority
        )
        return (
            f"{counts['pass']} of {len(report.findings)} exercised cases passed. "
            "The report keeps estimator differences, known product boundaries, and "
            "failed invariants separate. High-priority remediation is concentrated "
            f"in {focus}."
        )

    remaining = "; ".join(
        f"{finding.id} ({STATUS_LABEL[finding.status].lower()}): {finding.title}"
        for finding in non_pass
    )
    return (
        f"{counts['pass']} of {len(report.findings)} exercised cases passed, with no "
        "high-priority non-pass findings. The remaining explicitly bounded items are "
        f"{remaining}."
    )


def render_markdown(report: VerificationReport) -> str:
    counts = report.counts
    failing = [
        finding
        for finding in report.findings
        if finding.status != "pass" and finding.severity in {"high", "critical"}
    ]
    priority = "\n".join(
        f"{index}. **{finding.id}: {finding.title}.** {finding.recommendation}"
        for index, finding in enumerate(failing, start=1)
    ) or "No high-priority non-pass findings."
    env = "\n".join(f"- **{key}:** `{value}`" for key, value in report.environment.items())
    sections = "\n\n".join(_finding_section(finding) for finding in report.findings)
    return f"""# TrustBench Verification Report — EDA InsightLab Apex

> Executable differential and metamorphic testing of the exact browser-side statistical source. This report distinguishes agreement, definition divergence, implementation limitations, and failed invariants; it is not a generic code review or a model-quality certification.

## Executive result

- **Subject:** {report.subject}
- **Source SHA-256:** `{report.subject_sha256}`
- **Methodology:** TrustBench `{report.methodology_version}`
- **Generated:** `{report.generated_at_utc}`
- **Execution time:** `{report.elapsed_seconds:.6f}` seconds
- **Checks:** {len(report.findings)} total — {counts['pass']} pass, {counts['divergence']} definition divergences, {counts['limitation']} limitations, {counts['failure']} failed invariants
- **High-priority non-pass findings:** {report.high_priority_count}

{_executive_interpretation(report)}

## Immediate engineering priorities

{priority}

## Method

1. Hash the supplied `app.js` independently in Python and Node.
2. Extract named function declarations directly from that source into an isolated Node VM; do not paste or reimplement subject formulas.
3. Compare deterministic outputs with NumPy, SciPy, and scikit-learn references where a stable definition exists.
4. Apply metamorphic properties where no single golden value is sufficient, including row-order invariance.
5. Report definition differences separately from failed mathematical invariants.
6. Preserve the exact inputs, outputs, environment, source hash, and recommendations in JSON and Markdown.

## Findings

{sections}

## Environment

{env}

## Interpretation boundaries

- A passing case establishes agreement only for the exercised definition and fixture family; it is not a proof over all inputs.
- A divergence may reflect a legitimate alternative estimator, but the estimator must be named and consistently documented.
- The feature-ranking checks evaluate screening logic, not downstream predictive performance.
- Browser rendering, accessibility, generated Python fidelity, preprocessing lineage, and large-file performance are outside this first executable slice.
- Global preprocessing remains unsuitable for leakage-safe model evaluation unless split and fitted on training data only.

## Reproduction

```bash
python -m trustbench verify-apex \\
  --source /path/to/EDA-InsightLab-Apex/assets/js/app.js \\
  --output evidence/reports
```

The command fails closed if the expected functions cannot be extracted or if Node and Python disagree on the source fingerprint.
"""


def write_markdown(report: VerificationReport, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(render_markdown(report), encoding="utf-8")
