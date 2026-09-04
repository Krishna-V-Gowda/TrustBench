# TrustBench Verification Report — EDA InsightLab Apex

> Executable differential and metamorphic testing of the exact browser-side statistical source. This report distinguishes agreement, definition divergence, implementation limitations, and failed invariants; it is not a generic code review or a model-quality certification.

## Executive result

- **Subject:** EDA InsightLab Apex browser statistics engine
- **Source SHA-256:** `a15f8c9830c2729392e02e54abe2c62a3caba885b08f3aba8b575d522a2ef395`
- **Methodology:** TrustBench `0.1.0`
- **Generated:** `2026-09-03T00:00:00Z`
- **Execution time:** `0.000000` seconds
- **Checks:** 16 total — 7 pass, 2 definition divergences, 4 limitations, 3 failed invariants
- **High-priority non-pass findings:** 4

7 of 16 exercised cases passed. The report keeps estimator differences, known product boundaries, and failed invariants separate. High-priority remediation is concentrated in TB-APEX-005 (ingestion): Duplicate CSV headers silently overwrite data; TB-APEX-010 (feature relevance): Cramer's V changes when rows are reordered; TB-APEX-011 (feature selection): Categorical predictors are not target-aware for numeric outcomes; TB-APEX-012 (feature selection): Leakage guard depends on naming or recorded feature lineage.

## Immediate engineering priorities

1. **TB-APEX-005: Duplicate CSV headers silently overwrite data.** Validate header uniqueness before row materialization and emit a structured, row-independent schema error or deterministic renaming map.
2. **TB-APEX-010: Cramer's V changes when rows are reordered.** Reject unsupported cardinality or collapse levels deterministically by frequency with an explicit other bucket; never truncate by encounter order.
3. **TB-APEX-011: Categorical predictors are not target-aware for numeric outcomes.** Implement numeric-target-by-categorical-predictor relevance (eta-squared/ANOVA or cross-validated univariate models) and test permutation sensitivity.
4. **TB-APEX-012: Leakage guard depends on naming or recorded feature lineage.** Add exact/near-duplicate target checks, suspicious post-outcome feature rules, and provenance-aware leakage diagnostics; keep human review mandatory.

## Method

1. Hash the supplied `app.js` independently in Python and Node.
2. Extract named function declarations directly from that source into an isolated Node VM; do not paste or reimplement subject formulas.
3. Compare deterministic outputs with NumPy, SciPy, and scikit-learn references where a stable definition exists.
4. Apply metamorphic properties where no single golden value is sufficient, including row-order invariance.
5. Report definition differences separately from failed mathematical invariants.
6. Preserve the exact inputs, outputs, environment, source hash, and recommendations in JSON and Markdown.

## Findings

### TB-APEX-001 — Exact-source extraction is fingerprint-locked

**Classification:** PASS · **Severity:** INFO · **Area:** adapter integrity

**Invariant / claim tested.** The verifier executes selected functions extracted from the supplied Apex app.js rather than a rewritten statistical implementation.

**Observed.**

```json
{
  "function_count": 27,
  "sha256": "a15f8c9830c2729392e02e54abe2c62a3caba885b08f3aba8b575d522a2ef395"
}
```

**Reference.**

```json
{
  "python_sha256": "a15f8c9830c2729392e02e54abe2c62a3caba885b08f3aba8b575d522a2ef395",
  "required_functions": 27
}
```

**Evidence.** Node and Python independently hashed the same source; SHA-256 a15f8c9830c2729392e02e54abe2c62a3caba885b08f3aba8b575d522a2ef395.

**Recommended engineering action.** Keep the hash in every published report and fail closed when extraction anchors change.


### TB-APEX-002 — Core numeric primitives agree with reference libraries

**Classification:** PASS · **Severity:** INFO · **Area:** descriptive statistics

**Invariant / claim tested.** Linear quartiles, sample standard deviation, and pairwise-complete Pearson correlation should match NumPy-compatible definitions.

**Observed.**

```json
{
  "pearson": 1,
  "q1": 2,
  "q3": 4,
  "sample_std": 7.905694150421
}
```

**Reference.**

```json
{
  "pearson": 1.0,
  "q1": 2.0,
  "q3": 4.0,
  "sample_std": 7.905694150421
}
```

**Evidence.** Functions begin near app.js lines 447, 460, and 472.

**Recommended engineering action.** Promote these checks into permanent regression tests with boundary, constant-vector, and non-finite cases.


### TB-APEX-003 — Skewness uses a nonstandard mixed estimator

**Classification:** DEFINITION DIVERGENCE · **Severity:** MEDIUM · **Area:** descriptive statistics

**Invariant / claim tested.** A displayed skewness value needs a named estimator and should agree with a documented statistical convention.

**Observed.**

```json
{
  "apex": 0.749375498744,
  "matched_estimator": "no tested standard reference"
}
```

**Reference.**

```json
{
  "scipy_bias_false": 1.998334663318,
  "scipy_bias_true": 1.153739055798
}
```

**Evidence.** The implementation near app.js line 465 matches neither tested SciPy convention.

**Recommended engineering action.** Choose and document one estimator (for example adjusted Fisher-Pearson), add golden cases, and label the UI definition.


### TB-APEX-004 — Quoted CSV fields survive commas, escaped quotes, and embedded newlines

**Classification:** PASS · **Severity:** INFO · **Area:** ingestion

**Invariant / claim tested.** The local CSV parser should preserve common quoted-field semantics.

**Observed.**

```json
[
  {
    "name": "alpha, beta",
    "note": "said \"hello\"",
    "value": 3
  },
  {
    "name": "line two",
    "note": "embedded\nnewline",
    "value": 4
  }
]
```

**Reference.**

```json
[
  {
    "name": "alpha, beta",
    "note": "said \"hello\"",
    "value": 3
  },
  {
    "name": "line two",
    "note": "embedded\nnewline",
    "value": 4
  }
]
```

**Evidence.** Exercised the exact parser beginning near app.js line 398.

**Recommended engineering action.** Retain this as a regression fixture and add BOM, CR-only, blank-header, and malformed-quote cases.


### TB-APEX-005 — Duplicate CSV headers silently overwrite data

**Classification:** FAILED INVARIANT · **Severity:** HIGH · **Area:** ingestion

**Invariant / claim tested.** Every input field should remain addressable or ingestion should reject an ambiguous schema.

**Observed.**

```json
[
  {
    "measure": 2
  }
]
```

**Reference.**

```json
{
  "acceptable_behaviour": [
    "reject duplicate headers",
    "deterministically rename to measure and measure_2"
  ]
}
```

**Evidence.** The parsed row contains only one measure key with value 2; the first value is lost without an error.

**Recommended engineering action.** Validate header uniqueness before row materialization and emit a structured, row-independent schema error or deterministic renaming map.


### TB-APEX-006 — High-cardinality numeric identifiers are inferred as measurements

**Classification:** LIMITATION · **Severity:** MEDIUM · **Area:** schema inference

**Invariant / claim tested.** Identifier inference should not depend on a column being nonnumeric; integer keys must be protected from correlations, scaling, feature ranking, and PCA.

**Observed.**

```json
{
  "account_id_type": "numeric",
  "unique_ratio": 1.0
}
```

**Reference.**

```json
{
  "expected_semantic_type": "identifier or explicit unknown/high-cardinality numeric"
}
```

**Evidence.** The identifier branch near app.js line 501 excludes already inferred numeric columns.

**Recommended engineering action.** Add semantic key heuristics plus an explicit user override; never place high-cardinality numeric keys into PCA by default.


### TB-APEX-007 — Duplicate and IQR diagnostic counts match the declared rules

**Classification:** PASS · **Severity:** INFO · **Area:** profiling

**Invariant / claim tested.** Exact-row duplicate counting and linear-quartile 1.5×IQR flags should be independently reproducible.

**Observed.**

```json
{
  "duplicates": 1,
  "fences": [
    -0.625,
    6.375
  ],
  "x_outliers": 1
}
```

**Reference.**

```json
{
  "duplicates": 1,
  "fences": [
    -0.625,
    6.375
  ],
  "x_outliers": 1
}
```

**Evidence.** Computed through computeProfile beginning near app.js line 515.

**Recommended engineering action.** Add fixtures that distinguish row count, distinct duplicate groups, and extra copies; name the quartile interpolation method in documentation.


### TB-APEX-008 — Eta-squared group separation matches the reference decomposition

**Classification:** PASS · **Severity:** INFO · **Area:** feature relevance

**Invariant / claim tested.** Numeric-predictor versus categorical-target relevance should equal between-group sum of squares divided by total sum of squares.

**Observed.**

```json
0.964285714286
```

**Reference.**

```json
0.964285714286
```

**Evidence.** Exercised etaSquaredNumericByCategory near app.js line 1914.

**Recommended engineering action.** Add missing groups, single-level targets, imbalanced groups, and invariance under label renaming.


### TB-APEX-009 — Low-cardinality Cramer's V matches the uncorrected definition

**Classification:** PASS · **Severity:** INFO · **Area:** feature relevance

**Invariant / claim tested.** For complete low-cardinality tables, Apex should match the explicitly documented raw Cramer's V formula.

**Observed.**

```json
0.333333333333
```

**Reference.**

```json
{
  "bias_corrected": 0.0,
  "raw": 0.333333333333
}
```

**Evidence.** The implementation near app.js line 1926 uses sqrt(chi2 / (n * min(r-1,c-1))) without finite-sample correction.

**Recommended engineering action.** Label the statistic as uncorrected Cramer's V and optionally expose a bias-corrected mode for small or wide tables.


### TB-APEX-010 — Cramer's V changes when rows are reordered

**Classification:** FAILED INVARIANT · **Severity:** HIGH · **Area:** feature relevance

**Invariant / claim tested.** A categorical association statistic must be invariant to row order.

**Observed.**

```json
{
  "absolute_change": 0.448402626637,
  "original_order": 0.333333333333,
  "reordered": 0.781735959971
}
```

**Reference.**

```json
{
  "property": "row-order invariant",
  "raw_cramers_v_both_orders": 0.57735026919
}
```

**Evidence.** Encounter-order level truncation changes which categories enter the contingency calculation.

**Recommended engineering action.** Reject unsupported cardinality or collapse levels deterministically by frequency with an explicit other bucket; never truncate by encounter order.


### TB-APEX-011 — Categorical predictors are not target-aware for numeric outcomes

**Classification:** FAILED INVARIANT · **Severity:** HIGH · **Area:** feature selection

**Invariant / claim tested.** A target-aware ranker should distinguish a categorical feature that separates a numeric target from an equally cardinal but uninformative feature.

**Observed.**

```json
{
  "noise": {
    "name": "noise",
    "reason": "categorical predictor for numeric target",
    "score": 23,
    "status": "Drop",
    "type": "categorical"
  },
  "signal": {
    "name": "signal",
    "reason": "categorical predictor for numeric target",
    "score": 23,
    "status": "Drop",
    "type": "categorical"
  }
}
```

**Reference.**

```json
{
  "signal_should_rank_above_noise": true,
  "suggested_measure": "eta-squared with numeric target grouped by categorical predictor"
}
```

**Evidence.** Both features receive the same unique-ratio fallback even though signal partitions low versus high target values.

**Recommended engineering action.** Implement numeric-target-by-categorical-predictor relevance (eta-squared/ANOVA or cross-validated univariate models) and test permutation sensitivity.


### TB-APEX-012 — Leakage guard depends on naming or recorded feature lineage

**Classification:** LIMITATION · **Severity:** HIGH · **Area:** feature selection

**Invariant / claim tested.** An exact raw copy of the target under an unrelated name should be surfaced as a leakage hazard rather than recommended as a predictor.

**Observed.**

```json
{
  "excluded": false,
  "row": {
    "name": "untracked_proxy",
    "reason": "|r with target| = 1",
    "score": 100,
    "status": "Keep",
    "type": "numeric"
  }
}
```

**Reference.**

```json
{
  "expected": "flag exact/near target proxy for review or exclusion"
}
```

**Evidence.** isTargetDerivedColumn near app.js line 1682 checks naming and recorded engineered-feature source text, not value identity.

**Recommended engineering action.** Add exact/near-duplicate target checks, suspicious post-outcome feature rules, and provenance-aware leakage diagnostics; keep human review mandatory.


### TB-APEX-013 — PCA explained-variance ratios agree on complete numeric data

**Classification:** PASS · **Severity:** INFO · **Area:** dimension reduction

**Invariant / claim tested.** Power iteration plus rank-one deflation should reproduce a full-SVD PCA oracle on a well-conditioned complete matrix.

**Observed.**

```json
{
  "explained_variance_ratio": [
    0.999983567225,
    1.6432775e-05
  ],
  "pc1_pc2_abs_dot": 3e-12
}
```

**Reference.**

```json
{
  "orthogonality_target": 0.0,
  "sklearn_full_svd_ratio": [
    0.999983567225,
    1.6432775e-05
  ]
}
```

**Evidence.** computePCA begins near app.js line 2010 and uses 80 fixed power iterations.

**Recommended engineering action.** Retain full-SVD differential tests and add repeated-eigenvalue, ill-conditioned, sparse, and convergence-residual cases.


### TB-APEX-014 — PCA silently ignores numeric predictors after the first ten

**Classification:** LIMITATION · **Severity:** MEDIUM · **Area:** dimension reduction

**Invariant / claim tested.** The PCA result should enumerate all exclusions and must not imply that it represents the full numeric predictor space when columns were silently capped.

**Observed.**

```json
{
  "input_numeric_columns": 12,
  "used_columns": [
    "x00",
    "x01",
    "x02",
    "x03",
    "x04",
    "x05",
    "x06",
    "x07",
    "x08",
    "x09"
  ],
  "used_count": 10
}
```

**Reference.**

```json
{
  "expected": "all eligible columns or a visible deterministic selection policy"
}
```

**Evidence.** computePCA caps predictorNumericColumns before decomposition.

**Recommended engineering action.** Remove the cap for ordinary browser-sized data or expose the cap, selection order, and excluded columns in the UI and exported report.


### TB-APEX-015 — PCA missing-value scaling differs from an impute-then-scale pipeline

**Classification:** DEFINITION DIVERGENCE · **Severity:** MEDIUM · **Area:** dimension reduction

**Invariant / claim tested.** Missing-value handling before PCA needs an explicit, reproducible operation order.

**Observed.**

```json
{
  "apex_ratio": [
    0.505986773831,
    0.364337906602
  ]
}
```

**Reference.**

```json
{
  "sklearn_mean_impute_then_scale_ratio": [
    0.450018130619,
    0.300244184643
  ]
}
```

**Evidence.** standardizedMatrix substitutes zero for missing standardized values while scaling from pre-imputation summaries.

**Recommended engineering action.** Choose and document a pipeline order; for modeling, fit imputation and scaling on training data only and export those fitted parameters.


### TB-APEX-016 — Missing-token policy is deterministic but domain-sensitive

**Classification:** LIMITATION · **Severity:** LOW · **Area:** data semantics

**Invariant / claim tested.** String sentinels should be configurable because tokens such as '-' may be legitimate categorical values.

**Observed.**

```json
{
  "inputs": [
    null,
    "",
    "NA",
    "n/a",
    "-",
    "None",
    "0",
    0
  ],
  "is_missing": [
    true,
    true,
    true,
    true,
    true,
    false,
    false,
    false
  ]
}
```

**Reference.**

```json
{
  "expected_product_behaviour": "publish and permit override of missing-token vocabulary"
}
```

**Evidence.** isMissing near app.js line 383 hardcodes the sentinel set.

**Recommended engineering action.** Display the active sentinel policy at import, support per-column overrides, and record it in pipeline JSON.


## Environment

- **python:** `3.13.5`
- **python_implementation:** `CPython`
- **node:** `v22.16.0`
- **numpy:** `2.3.5`
- **pandas:** `2.2.3`
- **scipy:** `1.17.0`
- **scikit_learn:** `1.8.0`
- **platform:** `Linux-6.18.35-x86_64-with-glibc2.41`

## Interpretation boundaries

- A passing case establishes agreement only for the exercised definition and fixture family; it is not a proof over all inputs.
- A divergence may reflect a legitimate alternative estimator, but the estimator must be named and consistently documented.
- The feature-ranking checks evaluate screening logic, not downstream predictive performance.
- Browser rendering, accessibility, generated Python fidelity, preprocessing lineage, and large-file performance are outside this first executable slice.
- Global preprocessing remains unsuitable for leakage-safe model evaluation unless split and fitted on training data only.

## Reproduction

```bash
python -m trustbench verify-apex \
  --source /path/to/EDA-InsightLab-Apex/assets/js/app.js \
  --output evidence/reports
```

The command fails closed if the expected functions cannot be extracted or if Node and Python disagree on the source fingerprint.
