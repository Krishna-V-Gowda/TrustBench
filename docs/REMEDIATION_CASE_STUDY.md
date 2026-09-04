# Apex remediation case study

## Research question

Can a verifier do more than describe analytical defects—can it preserve counterexamples, guide narrow repairs, and demonstrate that the same checks no longer fail without hiding remaining limitations?

## Controlled design

The uploaded Apex `app.js` snapshot and the retained Apex v1.0.1 source were subjected to the same TrustBench 0.1.0 suite. Fixtures, independent references, tolerances, adapter, environment, and deterministic timestamp were held constant. The treatment was the source patch alone.

| Classification | Baseline | Apex v1.0.1 | Change |
|---|---:|---:|---:|
| Pass | 7 | 15 | +8 |
| Definition divergence | 2 | 0 | -2 |
| Limitation | 4 | 1 | -3 |
| Failed invariant | 3 | 0 | -3 |
| High-priority non-pass | 4 | 0 | -4 |

Baseline SHA-256: `a15f8c9830c2729392e02e54abe2c62a3caba885b08f3aba8b575d522a2ef395`  
Candidate SHA-256: `51a9853d2a465a71197a28e71d16821d69b3cbbebf6c1bdc753563c12a3688df`

## Repairs justified by counterexamples

- Duplicate headers now receive deterministic suffixes instead of overwriting fields.
- Skewness now implements the named adjusted Fisher–Pearson estimator.
- Identifier-like unique numeric keys are protected from measurement workflows.
- Raw Cramer's V uses the complete observed contingency table and is invariant to row ordering.
- Categorical predictors against numeric targets use eta-squared group separation.
- Exact raw target copies are excluded independently of names and engineered-feature lineage.
- PCA mean-imputes before sample scaling and no longer silently truncates after ten predictors.

## Result interpretation

The improved count is not a certification. It demonstrates that all reproduced high-priority counterexamples were eliminated under the fixed experimental suite. The hard-coded missing-token vocabulary remains a low-severity product limitation, and untested behavior remains outside scope.

The exact reports are [`apex-a15f8c9830c2.md`](../evidence/reports/apex-a15f8c9830c2.md) and [`apex-51a9853d2a46.md`](../evidence/reports/apex-51a9853d2a46.md). The source transition is preserved as [`apex-v1.0.1-statistical-correctness.patch`](../evidence/patches/apex-v1.0.1-statistical-correctness.patch).

## Reproduction

```bash
./scripts/compare_apex.sh \
  /path/to/baseline/assets/js/app.js \
  /path/to/hardened/assets/js/app.js
```

The source snapshot lacks Git metadata, so file-content hashes—not invented commit identifiers—are authoritative until publication.
