from __future__ import annotations

import hashlib
import json
from pathlib import Path

from trustbench.cases import run_apex_suite
from trustbench.reporting import render_markdown


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _locked_profiles(project_root: Path) -> dict[str, dict[str, object]]:
    profiles: dict[str, dict[str, object]] = {}
    for name in ("source.lock.json", "remediation.lock.json"):
        payload = json.loads((project_root / "subjects" / "apex" / name).read_text())
        result = payload.get("result")
        if result is not None:
            profiles[payload["sha256"]] = result
        else:
            # The original baseline predates the richer remediation lock schema.
            profiles[payload["sha256"]] = {
                "pass": 7,
                "divergence": 2,
                "limitation": 4,
                "failure": 3,
                "high_priority_non_pass": 4,
                "total": 16,
            }
    return profiles


def test_apex_verification_taxonomy_matches_locked_profile_when_known(
    apex_source: Path, project_root: Path, monkeypatch
) -> None:
    monkeypatch.setenv("SOURCE_DATE_EPOCH", "1788393600")
    report = run_apex_suite(apex_source, project_root / "adapters" / "apex_runtime.mjs")
    actual_sha = _sha256(apex_source)

    assert report.subject_sha256 == actual_sha
    assert len({finding.id for finding in report.findings}) == 16
    assert {finding.id for finding in report.findings} == {
        f"TB-APEX-{index:03d}" for index in range(1, 17)
    }

    locked = _locked_profiles(project_root).get(actual_sha)
    if locked is not None:
        assert report.counts == {
            "pass": locked["pass"],
            "divergence": locked["divergence"],
            "limitation": locked["limitation"],
            "failure": locked["failure"],
        }
        assert report.high_priority_count == locked["high_priority_non_pass"]
        assert sum(report.counts.values()) == locked["total"]


def test_report_contains_reproduction_boundary(
    apex_source: Path, project_root: Path, monkeypatch
) -> None:
    monkeypatch.setenv("SOURCE_DATE_EPOCH", "1788393600")
    report = run_apex_suite(apex_source, project_root / "adapters" / "apex_runtime.mjs")
    markdown = render_markdown(report)
    assert "not a generic code review" in markdown
    assert "row-order invariance" in markdown
    assert "SOURCE" not in markdown  # no unresolved template marker
