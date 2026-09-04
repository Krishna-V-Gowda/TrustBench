# TrustBench Verification Report — EDA InsightLab Apex

> Executable differential and metamorphic testing of the exact browser-side statistical source. This report distinguishes agreement, definition divergence, implementation limitations, and failed invariants; it is not a generic code review or a model-quality certification.

## Executive result

- **Subject:** EDA InsightLab Apex browser statistics engine
- **Source SHA-256:** `51a9853d2a465a71197a28e71d16821d69b3cbbebf6c1bdc753563c12a3688df`
- **Methodology:** TrustBench `0.1.0`
- **Generated:** `2026-09-03T00:00:00Z`
- **Execution time:** `0.000000` seconds
- **Checks:** 16 total — 15 pass, 0 definition divergences, 1 limitations, 0 failed invariants
- **High-priority non-pass findings:** 0

15 of 16 exercised cases passed, with no high-priority non-pass findings. The remaining explicitly bounded items are TB-APEX-016 (limitation): Missing-token policy is deterministic but domain-sensitive.

## Immediate engineering priorities

No high-priority non-pass findings.

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
  "sha256": "51a9853d2a465a71197a28e71d16821d69b3cbbebf6c1bdc753563c12a3688df"
}
```

**Reference.**

```json
{
  "python_sha256": "51a9853d2a465a71197a28e71d16821d69b3cbbebf6c1bdc753563c12a3688df",
  "required_functions": 27
}
```

**Evidence.** Node and Python independently hashed the same source; SHA-256 51a9853d2a465a71197a28e71d16821d69b3cbbebf6c1bdc753563c12a3688df.

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

**Evidence.** Functions begin near app.js lines 455, 468, and 483.

**Recommended engineering action.** Promote these checks into permanent regression tests with boundary, constant-vector, and non-finite cases.


### TB-APEX-003 — Skewness agrees with a named Fisher-Pearson estimator

**Classification:** PASS · **Severity:** INFO · **Area:** descriptive statistics

**Invariant / claim tested.** A displayed skewness value needs a named estimator and should agree with a documented statistical convention.

**Observed.**

```json
{
  "apex": 1.998334663318,
  "matched_estimator": "adjusted Fisher-Pearson"
}
```

**Reference.**

```json
{
  "scipy_bias_false": 1.998334663318,
  "scipy_bias_true": 1.153739055798
}
```

**Evidence.** The implementation near app.js line 473 matches adjusted Fisher-Pearson.

**Recommended engineering action.** Keep the estimator named in methodology and retain golden cases.


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


### TB-APEX-005 — Duplicate CSV headers are handled without data loss

**Classification:** PASS · **Severity:** INFO · **Area:** ingestion

**Invariant / claim tested.** Every input field should remain addressable or ingestion should reject an ambiguous schema.

**Observed.**

```json
[
  {
    "measure": 1,
    "measure_2": 2
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

**Evidence.** The subject preserves both values or rejects the ambiguous schema explicitly.

**Recommended engineering action.** Retain duplicate-header fixtures, including three-way collisions and blank names.


### TB-APEX-006 — ID-like high-cardinality numeric keys are protected

**Classification:** PASS · **Severity:** INFO · **Area:** schema inference

**Invariant / claim tested.** Identifier inference should not depend on a column being nonnumeric; integer keys must be protected from correlations, scaling, feature ranking, and PCA.

**Observed.**

```json
{
  "account_id_type": "identifier",
  "unique_ratio": 1.0
}
```

**Reference.**

```json
{
  "expected_semantic_type": "identifier or explicit unknown/high-cardinality numeric"
}
```

**Evidence.** The ID-like numeric column is classified as an identifier and excluded from numerical analysis.

**Recommended engineering action.** Retain semantic-name and override tests; document false-positive boundaries for continuous high-cardinality variables.


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

**Evidence.** Computed through computeProfile beginning near app.js line 528.

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

**Evidence.** Exercised etaSquaredNumericByCategory near app.js line 1941.

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

**Evidence.** The implementation near app.js line 1953 uses sqrt(chi2 / (n * min(r-1,c-1))) without finite-sample correction.

**Recommended engineering action.** Label the statistic as uncorrected Cramer's V and optionally expose a bias-corrected mode for small or wide tables.


### TB-APEX-010 — High-cardinality Cramer's V is row-order invariant

**Classification:** PASS · **Severity:** INFO · **Area:** feature relevance

**Invariant / claim tested.** A categorical association statistic must be invariant to row order.

**Observed.**

```json
{
  "absolute_change": 0.0,
  "original_order": 0.57735026919,
  "reordered": 0.57735026919
}
```

**Reference.**

```json
{
  "property": "row-order invariant",
  "raw_cramers_v_both_orders": 0.57735026919
}
```

**Evidence.** Both row orders reproduce the full-table raw Cramer's V reference.

**Recommended engineering action.** Retain row permutation, label permutation, and sparse high-cardinality tests.


### TB-APEX-011 — Categorical predictors are target-aware for numeric outcomes

**Classification:** PASS · **Severity:** INFO · **Area:** feature selection

**Invariant / claim tested.** A target-aware ranker should distinguish a categorical feature that separates a numeric target from an equally cardinal but uninformative feature.

**Observed.**

```json
{
  "noise": {
    "name": "noise",
    "reason": "target group separation = 0.00",
    "score": 18,
    "status": "Drop",
    "type": "categorical"
  },
  "signal": {
    "name": "signal",
    "reason": "target group separation = 0.75",
    "score": 93,
    "status": "Keep",
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

**Evidence.** The separating category outranks the equal-cardinality noise feature.

**Recommended engineering action.** Retain target permutation, monotonic transformation, and imbalanced-category cases.


### TB-APEX-012 — Exact raw target copies are blocked by the leakage guard

**Classification:** PASS · **Severity:** INFO · **Area:** feature selection

**Invariant / claim tested.** An exact raw copy of the target under an unrelated name should be surfaced as a leakage hazard rather than recommended as a predictor.

**Observed.**

```json
{
  "excluded": true,
  "row": null
}
```

**Reference.**

```json
{
  "expected": "flag exact/near target proxy for review or exclusion"
}
```

**Evidence.** The exact target copy is excluded or dropped independently of its name.

**Recommended engineering action.** Extend coverage to near-copies, monotonic encodings, temporal leakage, and post-outcome fields.


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

**Evidence.** computePCA begins near app.js line 2051 and uses 80 fixed power iterations.

**Recommended engineering action.** Retain full-SVD differential tests and add repeated-eigenvalue, ill-conditioned, sparse, and convergence-residual cases.


### TB-APEX-014 — PCA includes the complete eligible numeric predictor set

**Classification:** PASS · **Severity:** INFO · **Area:** dimension reduction

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
    "x09",
    "x10",
    "x11"
  ],
  "used_count": 12
}
```

**Reference.**

```json
{
  "expected": "all eligible columns or a visible deterministic selection policy"
}
```

**Evidence.** All eligible numeric predictors are included.

**Recommended engineering action.** Add explicit resource guards and benchmark wide-table behavior before raising practical limits.


### TB-APEX-015 — PCA missing-value operation order matches the declared oracle

**Classification:** PASS · **Severity:** INFO · **Area:** dimension reduction

**Invariant / claim tested.** Missing-value handling before PCA needs an explicit, reproducible operation order.

**Observed.**

```json
{
  "apex_ratio": [
    0.450018130619,
    0.300244184643
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

**Evidence.** Apex reproduces the mean-impute-then-scale PCA reference on the missingness fixture.

**Recommended engineering action.** Retain fixtures with asymmetric missingness and fit transformations on training data only for modeling.


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
