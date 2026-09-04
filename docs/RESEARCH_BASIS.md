# Research basis

TrustBench is aligned with current technical practice rather than generic portfolio advice.

## Primary technical references

- **NumPy testing:** `assert_allclose` makes tolerances, NaN semantics, shapes, and optional strict dtype matching explicit.  
  https://numpy.org/doc/stable/reference/generated/numpy.testing.assert_allclose.html
- **scikit-learn estimator checks:** the library ships an extensive conformance suite for validation, shapes, APIs, and estimator-type behavior.  
  https://scikit-learn.org/stable/modules/generated/sklearn.utils.estimator_checks.check_estimator.html
- **Hypothesis:** property-based testing generates edge cases from declared input domains and shrinks failures into useful counterexamples.  
  https://hypothesis.readthedocs.io/
- **NIST AI RMF / AIRC:** testing, evaluation, verification, and validation are treated as lifecycle activities supporting validity, reliability, and robustness.  
  https://airc.nist.gov/
- **SLSA 1.2:** build provenance records where, when, and how artifacts were produced and supports verifiable supply-chain integrity.  
  https://slsa.dev/spec/v1.2/
- **Reproducible Builds:** `SOURCE_DATE_EPOCH` provides a standardized input for deterministic timestamps.  
  https://reproducible-builds.org/specs/source-date-epoch/

## Current specialist signal

A current Jane Street Formal Methods Engineer opening explicitly names static analysis, proof systems, refinement types, and property-based testing, while asking for engineers who can turn research ideas into practical tools. Its current low-latency and ML-performance roles likewise emphasize measurement, profiling, computer architecture, and end-to-end systems reasoning rather than framework accumulation.

These sources do not prove that one project guarantees hiring outcomes. They support the narrower portfolio judgment that executable verification, counterexample generation, provenance, and measurable systems behavior are specialist-relevant and unusually defensible topics.
