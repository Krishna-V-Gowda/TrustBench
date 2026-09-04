from __future__ import annotations

import hashlib
import json
import math
import re
from pathlib import Path

import pytest

from trustbench.apex import ApexAdapter, ApexAdapterError


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_adapter_is_fingerprint_locked_to_supplied_source(
    apex_source: Path, project_root: Path
) -> None:
    """The Node adapter and Python controller must fingerprint the same exact file."""
    adapter = ApexAdapter(apex_source, project_root / "adapters" / "apex_runtime.mjs")
    manifest = adapter.manifest()
    expected_sha = _sha256(apex_source)

    assert manifest["sourceSha256"] == expected_sha
    assert adapter.source_sha256 == expected_sha
    assert len(manifest["extractedFunctions"]) == 27
    assert "computePCA" in manifest["extractedFunctions"]
    assert "featureSelectionRows" in manifest["extractedFunctions"]


def test_adapter_executes_subject_math(apex_source: Path, project_root: Path) -> None:
    adapter = ApexAdapter(apex_source, project_root / "adapters" / "apex_runtime.mjs")
    results = adapter.call(
        "batch",
        requests=[
            {"op": "quantile", "values": [1, 2, 3, 4], "q": 0.25},
            {"op": "std", "values": [1, 2, 3, 4]},
            {"op": "pearson", "x": [1, 2, 3], "y": [2, 4, 6]},
        ],
    )
    assert math.isclose(results[0], 1.75)
    assert math.isclose(results[1], 1.2909944487358056)
    assert math.isclose(results[2], 1.0)


def test_adapter_fails_closed_when_subject_shape_changes(
    tmp_path: Path, project_root: Path
) -> None:
    incomplete = tmp_path / "app.js"
    incomplete.write_text("(() => { function isMissing() { return false; } })();\n")
    adapter = ApexAdapter(incomplete, project_root / "adapters" / "apex_runtime.mjs")
    with pytest.raises(ApexAdapterError, match="required function not found"):
        adapter.manifest()


@pytest.mark.parametrize("lock_name", ["source.lock.json", "remediation.lock.json"])
def test_declared_source_locks_are_valid_and_have_reports(
    project_root: Path, lock_name: str
) -> None:
    lock = json.loads((project_root / "subjects" / "apex" / lock_name).read_text())
    sha = lock["sha256"]

    assert re.fullmatch(r"[0-9a-f]{64}", sha)
    assert lock["relative_path"] == "assets/js/app.js"
    assert (project_root / "evidence" / "reports" / f"apex-{sha[:12]}.json").is_file()
    assert (project_root / "evidence" / "reports" / f"apex-{sha[:12]}.md").is_file()
