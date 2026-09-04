#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
baseline="$root/subjects/apex/snapshots/apex-v1.0.0-app.js"
hardened="${1:-${TRUSTBENCH_APEX_SOURCE:-$root/subjects/apex/snapshots/apex-v1.0.1-app.js}}"
expected_baseline="a15f8c9830c2729392e02e54abe2c62a3caba885b08f3aba8b575d522a2ef395"
expected_hardened="51a9853d2a465a71197a28e71d16821d69b3cbbebf6c1bdc753563c12a3688df"
tmp="$(mktemp -d "${TMPDIR:-/tmp}/trustbench-verify.XXXXXX")"
trap 'rm -rf "$tmp"' EXIT

export PYTHONPATH="$root/src${PYTHONPATH:+:$PYTHONPATH}"
export TRUSTBENCH_APEX_SOURCE="$hardened"
export SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-1788393600}"
export PYTHONDONTWRITEBYTECODE=1

hash_file() {
  python3 - "$1" <<'PY'
from hashlib import sha256
from pathlib import Path
import sys
print(sha256(Path(sys.argv[1]).read_bytes()).hexdigest())
PY
}

printf '%s\n' '[1/8] locked subject fingerprints'
[[ "$(hash_file "$baseline")" == "$expected_baseline" ]]
[[ "$(hash_file "$hardened")" == "$expected_hardened" ]]
printf 'baseline=%s\nhardened=%s\n' "$expected_baseline" "$expected_hardened"

printf '%s\n' '[2/8] framework and fail-closed tests'
python3 -m pytest -q -p no:cacheprovider

printf '%s\n' '[3/8] exact-source transition reproduction'
"$root/scripts/reproduce_transition.sh" "$baseline" "$hardened" "$tmp/reports" >/dev/null

printf '%s\n' '[4/8] retained evidence equivalence'
python3 - "$tmp/reports" "$root/evidence/reports" <<'PY'
from pathlib import Path
import json
import sys
fresh, retained = map(Path, sys.argv[1:])
def canonicalize_markdown(text):
    lines = text.splitlines()
    try:
        start = lines.index('## Environment')
        end = lines.index('## Interpretation boundaries', start)
    except ValueError as exc:
        raise SystemExit(f'Missing required report section: {exc}') from exc

    # Environment metadata is intentionally machine-specific. The evidence
    # verifier therefore requires the section to exist and be populated, but
    # excludes its runtime-specific values from cross-environment equality.
    environment_block = lines[start + 1:end]
    if not environment_block or not any(line.startswith('- **python:**') for line in environment_block):
        raise SystemExit('Environment section is missing required runtime metadata')

    return '\n'.join(lines[:start] + [
        '## Environment',
        '- **environment metadata:** machine-specific; excluded from evidence equality'
    ] + lines[end:])

for stem in ('apex-a15f8c9830c2', 'apex-51a9853d2a46'):
    fresh_md = canonicalize_markdown(
        (fresh / f'{stem}.md').read_text(encoding='utf-8')
    )
    retained_md = canonicalize_markdown(
        (retained / f'{stem}.md').read_text(encoding='utf-8')
    )
    if fresh_md != retained_md:
        raise SystemExit(f'Markdown evidence mismatch: {stem}')

    fresh_json = json.loads((fresh / f'{stem}.json').read_text(encoding='utf-8'))
    retained_json = json.loads((retained / f'{stem}.json').read_text(encoding='utf-8'))

    # subject_path and environment describe execution provenance rather than
    # analytical evidence. They are expected to differ across clean machines.
    # Every remaining result, invariant, counterexample and interpretation
    # remains subject to exact equality.
    fresh_json.pop('subject_path', None)
    retained_json.pop('subject_path', None)
    fresh_json.pop('environment', None)
    retained_json.pop('environment', None)

    if fresh_json != retained_json:
        raise SystemExit(f'JSON evidence mismatch: {stem}')

print('retained reports reproduce semantically; runtime environment metadata is intentionally machine-specific')

PY

printf '%s\n' '[5/8] transition manifest integrity'
python3 - "$root/evidence/transitions/apex-v1.0.0-to-v1.0.1.json" <<'PY'
import json, sys
value=json.load(open(sys.argv[1]))
text=json.dumps(value)
for required in ('a15f8c9830c2729392e02e54abe2c62a3caba885b08f3aba8b575d522a2ef395','51a9853d2a465a71197a28e71d16821d69b3cbbebf6c1bdc753563c12a3688df'):
    assert required in text
print('transition manifest contains both locked fingerprints')
PY

printf '%s\n' '[6/8] Node adapter syntax'
node --check "$root/adapters/apex_runtime.mjs"

printf '%s\n' '[7/8] Python compilation without bytecode'
python3 - "$root" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1])
paths=sorted((root/'src').rglob('*.py'))+sorted((root/'tests').rglob('*.py'))
for path in paths:
    compile(path.read_text(encoding='utf-8'), str(path), 'exec')
print(f'compiled {len(paths)} Python source files')
PY

printf '%s\n' '[8/8] generated-residue guard'
if find "$root" -type d \( -name __pycache__ -o -name .pytest_cache -o -name .venv -o -name node_modules -o -name build -o -name dist \) -print -quit | grep -q .; then
  echo 'generated residue detected' >&2
  exit 1
fi
printf 'TrustBench delivery verification passed.\n'
