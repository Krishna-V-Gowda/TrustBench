# Limitations and non-claims

TrustBench 0.1.0 is an executable research artifact, not a certification authority.

## Subject coverage

The current Apex adapter reaches selected pure or state-bounded functions from one browser bundle. It does not yet execute:

- DOM rendering and interaction behavior;
- the complete cleaning and feature-engineering workflow;
- CSV/JSON/generated-Python transformation equivalence;
- undo/redo lineage across every operation;
- browser-specific file APIs;
- large-dataset memory and latency behavior;
- accessibility or responsive design.

## Oracle coverage

Reference libraries can encode different conventions. The report names the chosen definition and treats plausible alternatives as divergences rather than automatic bugs. The oracle implementation itself is tested, but independent review is still valuable.

## Adapter robustness

The function extractor is intentionally narrow and fail-closed. It understands the current declaration style; a bundler, minifier, renamed function, or materially different syntax will require an adapter update. This is preferable to silently testing stale copied logic.

## Security

`node:vm` is used to isolate browser-dependent state, not to execute untrusted hostile code safely. Run only reviewed local subjects. The fetch helper verifies content integrity after download but does not establish publisher identity or signed provenance.

## Performance

The recorded elapsed time is an execution trace for reproducibility, not a benchmark claim. The adapter starts Node processes and prioritizes auditability over throughput in this release.

## Publication boundary

The source snapshot lacks `.git` metadata. The report is strongly pinned to file content but not yet to a public commit identifier. Resolve and record the immutable commit before presenting the artifact as release-grade provenance.
