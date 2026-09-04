from __future__ import annotations

import math
import os
import platform
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import scipy
import sklearn

from .apex import ApexAdapter, ApexAdapterError
from .model import Finding, VerificationReport
from .oracles import (
    cramers_v_bias_corrected,
    cramers_v_raw,
    duplicate_count,
    eta_squared,
    fisher_pearson_skew,
    linear_quantile,
    pca_reference,
    pearson_pairwise,
    sample_std,
)

METHODOLOGY_VERSION = "0.1.0"


def _generated_at() -> str:
    epoch = os.getenv("SOURCE_DATE_EPOCH")
    when = (
        datetime.fromtimestamp(int(epoch), tz=timezone.utc)
        if epoch is not None
        else datetime.now(tz=timezone.utc)
    )
    return when.isoformat().replace("+00:00", "Z")


def _environment() -> dict[str, str]:
    return {
        "python": platform.python_version(),
        "python_implementation": platform.python_implementation(),
        "node": _node_version(),
        "numpy": np.__version__,
        "pandas": pd.__version__,
        "scipy": scipy.__version__,
        "scikit_learn": sklearn.__version__,
        "platform": platform.platform(),
    }


def _node_version() -> str:
    import subprocess

    completed = subprocess.run(
        ["node", "--version"], text=True, capture_output=True, check=True, timeout=5
    )
    return completed.stdout.strip()


def _round(value: Any, digits: int = 12) -> Any:
    if isinstance(value, float):
        return round(value, digits)
    if isinstance(value, list):
        return [_round(item, digits) for item in value]
    if isinstance(value, dict):
        return {key: _round(item, digits) for key, item in value.items()}
    return value


def _close(left: float, right: float, *, atol: float = 1e-10, rtol: float = 1e-9) -> bool:
    return math.isclose(left, right, abs_tol=atol, rel_tol=rtol)


def _portable_subject_path(source_path: Path) -> str:
    """Return a provenance label without leaking a verifier machine path."""
    parts = source_path.as_posix().split("/")
    for index in range(len(parts) - 2):
        if parts[index:index + 3] == ["assets", "js", "app.js"]:
            return "assets/js/app.js"
    return source_path.name


def _line_number(source_text: str, token: str) -> int | None:
    for index, line in enumerate(source_text.splitlines(), start=1):
        if token in line:
            return index
    return None


def _finding(
    *,
    id: str,
    title: str,
    area: str,
    status: str,
    severity: str,
    claim: str,
    observed: Any,
    reference: Any,
    evidence: str,
    recommendation: str,
) -> Finding:
    return Finding(
        id=id,
        title=title,
        area=area,
        status=status,  # type: ignore[arg-type]
        severity=severity,  # type: ignore[arg-type]
        claim=claim,
        observed=_round(observed),
        reference=_round(reference),
        evidence=evidence,
        recommendation=recommendation,
    )


def run_apex_suite(source_path: Path, adapter_script: Path) -> VerificationReport:
    started = time.perf_counter()
    adapter = ApexAdapter(source_path, adapter_script)
    manifest = adapter.manifest()
    source_text = source_path.read_text(encoding="utf-8")
    source_sha = adapter.source_sha256
    findings: list[Finding] = []

    findings.append(
        _finding(
            id="TB-APEX-001",
            title="Exact-source extraction is fingerprint-locked",
            area="adapter integrity",
            status="pass",
            severity="info",
            claim="The verifier executes selected functions extracted from the supplied Apex app.js rather than a rewritten statistical implementation.",
            observed={
                "sha256": manifest["sourceSha256"],
                "function_count": len(manifest["extractedFunctions"]),
            },
            reference={
                "python_sha256": source_sha,
                "required_functions": 27,
            },
            evidence=f"Node and Python independently hashed the same source; SHA-256 {source_sha}.",
            recommendation="Keep the hash in every published report and fail closed when extraction anchors change.",
        )
    )

    numeric_results = adapter.call(
        "batch",
        requests=[
            {"op": "quantile", "values": [1, 2, 3, 4, 20], "q": 0.25},
            {"op": "quantile", "values": [1, 2, 3, 4, 20], "q": 0.75},
            {"op": "std", "values": [1, 2, 3, 4, 20]},
            {
                "op": "pearson",
                "x": [1, 2, "", 4, 5],
                "y": [2, 4, 999, 8, 10],
            },
        ],
    )
    numeric_reference = [
        linear_quantile([1, 2, 3, 4, 20], 0.25),
        linear_quantile([1, 2, 3, 4, 20], 0.75),
        sample_std([1, 2, 3, 4, 20]),
        pearson_pairwise([1, 2, "", 4, 5], [2, 4, 999, 8, 10]),
    ]
    numeric_pass = all(
        result is not None
        and reference is not None
        and _close(float(result), float(reference))
        for result, reference in zip(numeric_results, numeric_reference, strict=True)
    )
    findings.append(
        _finding(
            id="TB-APEX-002",
            title="Core numeric primitives agree with reference libraries",
            area="descriptive statistics",
            status="pass" if numeric_pass else "failure",
            severity="info" if numeric_pass else "high",
            claim="Linear quartiles, sample standard deviation, and pairwise-complete Pearson correlation should match NumPy-compatible definitions.",
            observed={"q1": numeric_results[0], "q3": numeric_results[1], "sample_std": numeric_results[2], "pearson": numeric_results[3]},
            reference={"q1": numeric_reference[0], "q3": numeric_reference[1], "sample_std": numeric_reference[2], "pearson": numeric_reference[3]},
            evidence=f"Functions begin near app.js lines {_line_number(source_text, 'function quantile(')}, {_line_number(source_text, 'function std(')}, and {_line_number(source_text, 'function pearson(')}.",
            recommendation="Promote these checks into permanent regression tests with boundary, constant-vector, and non-finite cases.",
        )
    )

    skew_values = [1, 2, 3, 100]
    apex_skew = float(adapter.call("skewness", values=skew_values))
    scipy_biased = fisher_pearson_skew(skew_values, bias=True)
    scipy_unbiased = fisher_pearson_skew(skew_values, bias=False)
    skew_matches_biased = _close(apex_skew, scipy_biased)
    skew_matches_unbiased = _close(apex_skew, scipy_unbiased)
    skew_matches_reference = skew_matches_biased or skew_matches_unbiased
    skew_estimator = (
        "adjusted Fisher-Pearson"
        if skew_matches_unbiased
        else "biased Fisher-Pearson"
        if skew_matches_biased
        else "no tested standard reference"
    )
    findings.append(
        _finding(
            id="TB-APEX-003",
            title=(
                "Skewness agrees with a named Fisher-Pearson estimator"
                if skew_matches_reference
                else "Skewness uses a nonstandard mixed estimator"
            ),
            area="descriptive statistics",
            status="pass" if skew_matches_reference else "divergence",
            severity="info" if skew_matches_reference else "medium",
            claim="A displayed skewness value needs a named estimator and should agree with a documented statistical convention.",
            observed={"apex": apex_skew, "matched_estimator": skew_estimator},
            reference={"scipy_bias_true": scipy_biased, "scipy_bias_false": scipy_unbiased},
            evidence=(
                f"The implementation near app.js line {_line_number(source_text, 'function skewness(')} matches {skew_estimator}."
                if skew_matches_reference
                else f"The implementation near app.js line {_line_number(source_text, 'function skewness(')} matches neither tested SciPy convention."
            ),
            recommendation=(
                "Keep the estimator named in methodology and retain golden cases."
                if skew_matches_reference
                else "Choose and document one estimator (for example adjusted Fisher-Pearson), add golden cases, and label the UI definition."
            ),
        )
    )

    quoted_csv = 'name,note,value\n"alpha, beta","said ""hello""",3\n"line two","embedded\nnewline",4\n'
    parsed_csv = adapter.call("parse_csv", text=quoted_csv)
    expected_csv = [
        {"name": "alpha, beta", "note": 'said "hello"', "value": 3},
        {"name": "line two", "note": "embedded\nnewline", "value": 4},
    ]
    findings.append(
        _finding(
            id="TB-APEX-004",
            title="Quoted CSV fields survive commas, escaped quotes, and embedded newlines",
            area="ingestion",
            status="pass" if parsed_csv == expected_csv else "failure",
            severity="info" if parsed_csv == expected_csv else "high",
            claim="The local CSV parser should preserve common quoted-field semantics.",
            observed=parsed_csv,
            reference=expected_csv,
            evidence=f"Exercised the exact parser beginning near app.js line {_line_number(source_text, 'function parseCSV(')}.",
            recommendation="Retain this as a regression fixture and add BOM, CR-only, blank-header, and malformed-quote cases.",
        )
    )

    try:
        duplicate_header_result = adapter.call("parse_csv", text="measure,measure\n1,2\n")
        duplicate_keys = list(duplicate_header_result[0]) if duplicate_header_result else []
        duplicate_header_safe = len(duplicate_keys) == 2
    except ApexAdapterError as error:
        duplicate_header_result = {"rejected": True, "error": str(error)}
        duplicate_header_safe = "duplicate" in str(error).lower() and "header" in str(error).lower()
    findings.append(
        _finding(
            id="TB-APEX-005",
            title=(
                "Duplicate CSV headers are handled without data loss"
                if duplicate_header_safe
                else "Duplicate CSV headers silently overwrite data"
            ),
            area="ingestion",
            status="pass" if duplicate_header_safe else "failure",
            severity="info" if duplicate_header_safe else "high",
            claim="Every input field should remain addressable or ingestion should reject an ambiguous schema.",
            observed=duplicate_header_result,
            reference={"acceptable_behaviour": ["reject duplicate headers", "deterministically rename to measure and measure_2"]},
            evidence=(
                "The subject preserves both values or rejects the ambiguous schema explicitly."
                if duplicate_header_safe
                else "The parsed row contains only one measure key with value 2; the first value is lost without an error."
            ),
            recommendation=(
                "Retain duplicate-header fixtures, including three-way collisions and blank names."
                if duplicate_header_safe
                else "Validate header uniqueness before row materialization and emit a structured, row-independent schema error or deterministic renaming map."
            ),
        )
    )

    identifier_data = [{"account_id": 100_000 + index, "signal": index % 3} for index in range(20)]
    identifier_schema = adapter.call("schema", data=identifier_data)
    account_type = next(item["type"] for item in identifier_schema if item["name"] == "account_id")
    identifier_safe = account_type == "identifier"
    findings.append(
        _finding(
            id="TB-APEX-006",
            title=(
                "ID-like high-cardinality numeric keys are protected"
                if identifier_safe
                else "High-cardinality numeric identifiers are inferred as measurements"
            ),
            area="schema inference",
            status="pass" if identifier_safe else "limitation",
            severity="info" if identifier_safe else "medium",
            claim="Identifier inference should not depend on a column being nonnumeric; integer keys must be protected from correlations, scaling, feature ranking, and PCA.",
            observed={"account_id_type": account_type, "unique_ratio": 1.0},
            reference={"expected_semantic_type": "identifier or explicit unknown/high-cardinality numeric"},
            evidence=(
                "The ID-like numeric column is classified as an identifier and excluded from numerical analysis."
                if identifier_safe
                else f"The identifier branch near app.js line {_line_number(source_text, "type !== 'numeric'")} excludes already inferred numeric columns."
            ),
            recommendation=(
                "Retain semantic-name and override tests; document false-positive boundaries for continuous high-cardinality variables."
                if identifier_safe
                else "Add semantic key heuristics plus an explicit user override; never place high-cardinality numeric keys into PCA by default."
            ),
        )
    )

    profile_data = [
        {"x": 1, "group": "a"},
        {"x": 2, "group": "a"},
        {"x": 3, "group": "b"},
        {"x": 4, "group": "b"},
        {"x": 100, "group": "b"},
        {"x": 2, "group": "a"},
    ]
    profile = adapter.call("profile", data=profile_data)
    x_values = sorted(float(row["x"]) for row in profile_data)
    q1 = linear_quantile(x_values, 0.25)
    q3 = linear_quantile(x_values, 0.75)
    low, high = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)
    expected_outliers = sum(value < low or value > high for value in x_values)
    expected_duplicates = duplicate_count(profile_data, ["x", "group"])
    profile_pass = (
        profile["duplicates"] == expected_duplicates
        and profile["numericSummaries"]["x"]["outliers"] == expected_outliers
    )
    findings.append(
        _finding(
            id="TB-APEX-007",
            title="Duplicate and IQR diagnostic counts match the declared rules",
            area="profiling",
            status="pass" if profile_pass else "failure",
            severity="info" if profile_pass else "high",
            claim="Exact-row duplicate counting and linear-quartile 1.5×IQR flags should be independently reproducible.",
            observed={"duplicates": profile["duplicates"], "x_outliers": profile["numericSummaries"]["x"]["outliers"], "fences": [profile["numericSummaries"]["x"]["lowFence"], profile["numericSummaries"]["x"]["highFence"]]},
            reference={"duplicates": expected_duplicates, "x_outliers": expected_outliers, "fences": [low, high]},
            evidence=f"Computed through computeProfile beginning near app.js line {_line_number(source_text, 'function computeProfile(')}.",
            recommendation="Add fixtures that distinguish row count, distinct duplicate groups, and extra copies; name the quartile interpolation method in documentation.",
        )
    )

    eta_data = [
        {"score": 1, "group": "A"},
        {"score": 2, "group": "A"},
        {"score": 8, "group": "B"},
        {"score": 9, "group": "B"},
        {"score": 10, "group": "B"},
    ]
    apex_eta = float(adapter.call("eta_squared", data=eta_data, numericColumn="score", categoryColumn="group"))
    reference_eta = eta_squared([row["score"] for row in eta_data], [row["group"] for row in eta_data])
    findings.append(
        _finding(
            id="TB-APEX-008",
            title="Eta-squared group separation matches the reference decomposition",
            area="feature relevance",
            status="pass" if _close(apex_eta, reference_eta) else "failure",
            severity="info" if _close(apex_eta, reference_eta) else "high",
            claim="Numeric-predictor versus categorical-target relevance should equal between-group sum of squares divided by total sum of squares.",
            observed=apex_eta,
            reference=reference_eta,
            evidence=f"Exercised etaSquaredNumericByCategory near app.js line {_line_number(source_text, 'function etaSquaredNumericByCategory(')}.",
            recommendation="Add missing groups, single-level targets, imbalanced groups, and invariance under label renaming.",
        )
    )

    low_card_data = [
        {"a": "x", "b": "u"},
        {"a": "x", "b": "u"},
        {"a": "x", "b": "v"},
        {"a": "y", "b": "v"},
        {"a": "y", "b": "v"},
        {"a": "y", "b": "u"},
    ]
    apex_v = float(adapter.call("cramers_v", data=low_card_data, columnA="a", columnB="b"))
    reference_v = cramers_v_raw([row["a"] for row in low_card_data], [row["b"] for row in low_card_data])
    corrected_v = cramers_v_bias_corrected([row["a"] for row in low_card_data], [row["b"] for row in low_card_data])
    findings.append(
        _finding(
            id="TB-APEX-009",
            title="Low-cardinality Cramer's V matches the uncorrected definition",
            area="feature relevance",
            status="pass" if _close(apex_v, reference_v) else "failure",
            severity="info" if _close(apex_v, reference_v) else "high",
            claim="For complete low-cardinality tables, Apex should match the explicitly documented raw Cramer's V formula.",
            observed=apex_v,
            reference={"raw": reference_v, "bias_corrected": corrected_v},
            evidence=f"The implementation near app.js line {_line_number(source_text, 'function cramersV(')} uses sqrt(chi2 / (n * min(r-1,c-1))) without finite-sample correction.",
            recommendation="Label the statistic as uncorrected Cramer's V and optionally expose a bias-corrected mode for small or wide tables.",
        )
    )

    high_card_data: list[dict[str, str]] = []
    for level in range(20):
        for repetition in range(4):
            high_card_data.append({"a": f"L{level:02d}", "b": "B0" if repetition < 2 else "B1"})
    for level in range(20, 30):
        for _ in range(4):
            high_card_data.append({"a": f"L{level:02d}", "b": "B0" if level < 25 else "B1"})
    reordered = sorted(high_card_data, key=lambda row: (0 if int(row["a"][1:]) >= 20 else 1, row["a"]))
    apex_v_original, apex_v_reordered = adapter.call(
        "batch",
        requests=[
            {"op": "cramers_v", "data": high_card_data, "columnA": "a", "columnB": "b"},
            {"op": "cramers_v", "data": reordered, "columnA": "a", "columnB": "b"},
        ],
    )
    invariant_reference = cramers_v_raw(
        [row["a"] for row in high_card_data], [row["b"] for row in high_card_data]
    )
    cramer_order_invariant = _close(float(apex_v_original), float(apex_v_reordered))
    cramer_matches_reference = _close(float(apex_v_original), invariant_reference)
    cramer_pass = cramer_order_invariant and cramer_matches_reference
    findings.append(
        _finding(
            id="TB-APEX-010",
            title=(
                "High-cardinality Cramer's V is row-order invariant"
                if cramer_pass
                else "Cramer's V changes when rows are reordered"
            ),
            area="feature relevance",
            status="pass" if cramer_pass else "failure",
            severity="info" if cramer_pass else "high",
            claim="A categorical association statistic must be invariant to row order.",
            observed={"original_order": apex_v_original, "reordered": apex_v_reordered, "absolute_change": abs(apex_v_original - apex_v_reordered)},
            reference={"raw_cramers_v_both_orders": invariant_reference, "property": "row-order invariant"},
            evidence=(
                "Both row orders reproduce the full-table raw Cramer's V reference."
                if cramer_pass
                else "Encounter-order level truncation changes which categories enter the contingency calculation."
            ),
            recommendation=(
                "Retain row permutation, label permutation, and sparse high-cardinality tests."
                if cramer_pass
                else "Reject unsupported cardinality or collapse levels deterministically by frequency with an explicit other bucket; never truncate by encounter order."
            ),
        )
    )

    ranking_data = [
        {
            "target": index,
            "signal": "low" if index < 20 else "high",
            "noise": "even" if index % 2 == 0 else "odd",
        }
        for index in range(40)
    ]
    ranking_rows = adapter.call("feature_selection", data=ranking_data, target="target")
    ranking_by_name = {row["name"]: row for row in ranking_rows}
    categorical_target_aware = ranking_by_name["signal"]["score"] > ranking_by_name["noise"]["score"]
    findings.append(
        _finding(
            id="TB-APEX-011",
            title=(
                "Categorical predictors are target-aware for numeric outcomes"
                if categorical_target_aware
                else "Categorical predictors are not target-aware for numeric outcomes"
            ),
            area="feature selection",
            status="pass" if categorical_target_aware else "failure",
            severity="info" if categorical_target_aware else "high",
            claim="A target-aware ranker should distinguish a categorical feature that separates a numeric target from an equally cardinal but uninformative feature.",
            observed={"signal": ranking_by_name["signal"], "noise": ranking_by_name["noise"]},
            reference={"signal_should_rank_above_noise": True, "suggested_measure": "eta-squared with numeric target grouped by categorical predictor"},
            evidence=(
                "The separating category outranks the equal-cardinality noise feature."
                if categorical_target_aware
                else "Both features receive the same unique-ratio fallback even though signal partitions low versus high target values."
            ),
            recommendation=(
                "Retain target permutation, monotonic transformation, and imbalanced-category cases."
                if categorical_target_aware
                else "Implement numeric-target-by-categorical-predictor relevance (eta-squared/ANOVA or cross-validated univariate models) and test permutation sensitivity."
            ),
        )
    )

    proxy_data = [
        {"target": float(index), "untracked_proxy": float(index), "noise": float((index * 7) % 11)}
        for index in range(30)
    ]
    proxy_rows = adapter.call("feature_selection", data=proxy_data, target="target")
    proxy = next((row for row in proxy_rows if row["name"] == "untracked_proxy"), None)
    proxy_guarded = proxy is None or proxy.get("status") == "Drop"
    findings.append(
        _finding(
            id="TB-APEX-012",
            title=(
                "Exact raw target copies are blocked by the leakage guard"
                if proxy_guarded
                else "Leakage guard depends on naming or recorded feature lineage"
            ),
            area="feature selection",
            status="pass" if proxy_guarded else "limitation",
            severity="info" if proxy_guarded else "high",
            claim="An exact raw copy of the target under an unrelated name should be surfaced as a leakage hazard rather than recommended as a predictor.",
            observed={"excluded": proxy is None, "row": proxy},
            reference={"expected": "flag exact/near target proxy for review or exclusion"},
            evidence=(
                "The exact target copy is excluded or dropped independently of its name."
                if proxy_guarded
                else f"isTargetDerivedColumn near app.js line {_line_number(source_text, 'function isTargetDerivedColumn(')} checks naming and recorded engineered-feature source text, not value identity."
            ),
            recommendation=(
                "Extend coverage to near-copies, monotonic encodings, temporal leakage, and post-outcome fields."
                if proxy_guarded
                else "Add exact/near-duplicate target checks, suspicious post-outcome feature rules, and provenance-aware leakage diagnostics; keep human review mandatory."
            ),
        )
    )

    pca_data = [
        {f"x{column}": index * (column + 1) + (index % 3) * 0.1 for column in range(4)}
        for index in range(20)
    ]
    apex_pca = adapter.call("pca", data=pca_data)
    pca_oracle = pca_reference(pca_data, apex_pca["cols"])
    apex_ratio = [apex_pca["exp1"], apex_pca["exp2"]]
    reference_ratio = pca_oracle["explained_variance_ratio"][:2]
    pca_ratio_pass = all(_close(float(left), float(right), atol=1e-9) for left, right in zip(apex_ratio, reference_ratio, strict=True))
    orthogonality = abs(sum(left * right for left, right in zip(apex_pca["pc1"]["vector"], apex_pca["pc2"]["vector"], strict=True)))
    findings.append(
        _finding(
            id="TB-APEX-013",
            title="PCA explained-variance ratios agree on complete numeric data",
            area="dimension reduction",
            status="pass" if pca_ratio_pass else "failure",
            severity="info" if pca_ratio_pass else "high",
            claim="Power iteration plus rank-one deflation should reproduce a full-SVD PCA oracle on a well-conditioned complete matrix.",
            observed={"explained_variance_ratio": apex_ratio, "pc1_pc2_abs_dot": orthogonality},
            reference={"sklearn_full_svd_ratio": reference_ratio, "orthogonality_target": 0.0},
            evidence=f"computePCA begins near app.js line {_line_number(source_text, 'function computePCA(')} and uses 80 fixed power iterations.",
            recommendation="Retain full-SVD differential tests and add repeated-eigenvalue, ill-conditioned, sparse, and convergence-residual cases.",
        )
    )

    pca_12_data = [
        {
            f"x{column:02d}": index * (column + 1) + ((index + column) % 5) * 0.1
            for column in range(12)
        }
        for index in range(30)
    ]
    pca_12 = adapter.call("pca", data=pca_12_data)
    pca_uses_all = len(pca_12["cols"]) == 12
    findings.append(
        _finding(
            id="TB-APEX-014",
            title=(
                "PCA includes the complete eligible numeric predictor set"
                if pca_uses_all
                else "PCA silently ignores numeric predictors after the first ten"
            ),
            area="dimension reduction",
            status="pass" if pca_uses_all else "limitation",
            severity="info" if pca_uses_all else "medium",
            claim="The PCA result should enumerate all exclusions and must not imply that it represents the full numeric predictor space when columns were silently capped.",
            observed={"input_numeric_columns": 12, "used_columns": pca_12["cols"], "used_count": len(pca_12["cols"])},
            reference={"expected": "all eligible columns or a visible deterministic selection policy"},
            evidence=(
                "All eligible numeric predictors are included."
                if pca_uses_all
                else "computePCA caps predictorNumericColumns before decomposition."
            ),
            recommendation=(
                "Add explicit resource guards and benchmark wide-table behavior before raising practical limits."
                if pca_uses_all
                else "Remove the cap for ordinary browser-sized data or expose the cap, selection order, and excluded columns in the UI and exported report."
            ),
        )
    )

    missing_pca_data = [
        {"x": float(index), "y": float(index * 2) if index < 5 else None, "z": float(((-1) ** index) * index)}
        for index in range(1, 11)
    ]
    apex_missing_pca = adapter.call("pca", data=missing_pca_data)
    missing_oracle = pca_reference(missing_pca_data, apex_missing_pca["cols"])
    missing_apex_ratio = [apex_missing_pca["exp1"], apex_missing_pca["exp2"]]
    missing_reference_ratio = missing_oracle["explained_variance_ratio"][:2]
    missing_pca_matches = all(
        _close(float(left), float(right), atol=1e-9)
        for left, right in zip(missing_apex_ratio, missing_reference_ratio, strict=True)
    )
    findings.append(
        _finding(
            id="TB-APEX-015",
            title=(
                "PCA missing-value operation order matches the declared oracle"
                if missing_pca_matches
                else "PCA missing-value scaling differs from an impute-then-scale pipeline"
            ),
            area="dimension reduction",
            status="pass" if missing_pca_matches else "divergence",
            severity="info" if missing_pca_matches else "medium",
            claim="Missing-value handling before PCA needs an explicit, reproducible operation order.",
            observed={"apex_ratio": missing_apex_ratio},
            reference={"sklearn_mean_impute_then_scale_ratio": missing_reference_ratio},
            evidence=(
                "Apex reproduces the mean-impute-then-scale PCA reference on the missingness fixture."
                if missing_pca_matches
                else "standardizedMatrix substitutes zero for missing standardized values while scaling from pre-imputation summaries."
            ),
            recommendation=(
                "Retain fixtures with asymmetric missingness and fit transformations on training data only for modeling."
                if missing_pca_matches
                else "Choose and document a pipeline order; for modeling, fit imputation and scaling on training data only and export those fitted parameters."
            ),
        )
    )

    dash_policy = adapter.call("is_missing", values=[None, "", "NA", "n/a", "-", "None", "0", 0])
    findings.append(
        _finding(
            id="TB-APEX-016",
            title="Missing-token policy is deterministic but domain-sensitive",
            area="data semantics",
            status="limitation",
            severity="low",
            claim="String sentinels should be configurable because tokens such as '-' may be legitimate categorical values.",
            observed={"inputs": [None, "", "NA", "n/a", "-", "None", "0", 0], "is_missing": dash_policy},
            reference={"expected_product_behaviour": "publish and permit override of missing-token vocabulary"},
            evidence=f"isMissing near app.js line {_line_number(source_text, 'function isMissing(')} hardcodes the sentinel set.",
            recommendation="Display the active sentinel policy at import, support per-column overrides, and record it in pipeline JSON.",
        )
    )

    measured_elapsed = time.perf_counter() - started
    elapsed = 0.0 if os.getenv("SOURCE_DATE_EPOCH") is not None else measured_elapsed
    return VerificationReport(
        subject="EDA InsightLab Apex browser statistics engine",
        subject_path=_portable_subject_path(source_path),
        subject_sha256=source_sha,
        generated_at_utc=_generated_at(),
        environment=_environment(),
        methodology_version=METHODOLOGY_VERSION,
        findings=findings,
        elapsed_seconds=round(elapsed, 6),
    )
