# Verification methodology

## Question

Can an analytical product's visible numerical and preprocessing claims be reproduced from the implementation that users actually run?

## Evidence classes

1. **Observed:** directly produced by the exact subject source.
2. **Reference-verified:** compared with an independent numerical implementation under a named definition.
3. **Property-verified:** checked against an invariant such as row-order or label-renaming invariance.
4. **Source-verified:** established by tracing an execution path or hard-coded policy.
5. **Not verified:** outside the executable scope of the current adapter.

No finding is upgraded from one class to another without new evidence.

## Test families

### Golden cases

Small examples with analytically obvious answers. They are useful for parser semantics, exact duplicate counts, and degenerate behavior.

### Differential tests

The same fixture is executed by the subject and an independent reference. A tolerance is applied only where floating-point arithmetic requires it. Definitions are named, including quartile interpolation and degrees of freedom.

### Metamorphic tests

A transformation that should preserve the answer is applied when no authoritative scalar oracle is sufficient. The first suite uses row reordering to test categorical-association invariance.

### Adversarial fixtures

Inputs are chosen to expose semantic boundaries rather than approximate typical data: duplicate headers, numeric keys, high-cardinality categories, target copies, missing values, and more predictors than the product's hidden cap.

## Failure taxonomy

- **Pass:** agreement in the declared scope.
- **Definition divergence:** an alternate formula or operation order; may be legitimate after documentation and validation.
- **Limitation:** bounded or implicit behavior that can mislead outside its safe operating envelope.
- **Failed invariant:** a behavior that should not depend on irrelevant representation details or that destroys input information.

## Reproducibility record

Each generated report stores:

- subject SHA-256;
- methodology version;
- generation time controlled by `SOURCE_DATE_EPOCH` when supplied;
- Python, Node, NumPy, pandas, SciPy, and scikit-learn versions;
- every observed and reference result;
- elapsed suite time.

## Current statistical choices

| Quantity | Reference |
|---|---|
| Quartiles | NumPy `quantile(..., method="linear")` |
| Standard deviation | NumPy `std(..., ddof=1)` |
| Skewness | SciPy Fisher-Pearson, both biased and bias-corrected variants shown |
| Pearson correlation | NumPy correlation on pairwise-complete finite observations |
| Eta-squared | between-group sum of squares / total sum of squares |
| Cramer's V | raw chi-square definition; bias-corrected value also recorded |
| PCA | scikit-learn full-SVD reference after explicit imputation/scaling |

## Interpretation

A passing differential check does not prove equivalence over the entire input domain. Confidence grows through fixture diversity, generated counterexamples, property-based testing, cross-version execution, and independent adapters. The report therefore states exactly what was checked and what remains outside scope.
