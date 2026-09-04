#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
before="${1:-}"
after="${2:-}"
if [[ -z "$before" || -z "$after" ]]; then
  printf 'usage: %s /path/to/before/app.js /path/to/after/app.js\n' "$0" >&2
  exit 64
fi

export PYTHONPATH="$root/src${PYTHONPATH:+:$PYTHONPATH}"
export SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-1788393600}"

python3 -m trustbench verify-apex --source "$before" --output "$root/evidence/reports"
python3 -m trustbench verify-apex --source "$after" --output "$root/evidence/reports"
printf 'Controlled Apex comparison reports generated.\n'
