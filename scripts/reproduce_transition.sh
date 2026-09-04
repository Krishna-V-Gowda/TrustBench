#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
baseline="${1:-$root/subjects/apex/snapshots/apex-v1.0.0-app.js}"
hardened="${2:-$root/subjects/apex/snapshots/apex-v1.0.1-app.js}"
output="${3:-$root/evidence/reports}"

export PYTHONPATH="$root/src${PYTHONPATH:+:$PYTHONPATH}"
export SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-1788393600}"
export PYTHONDONTWRITEBYTECODE=1

python3 -m trustbench verify-apex --source "$baseline" --output "$output"
python3 -m trustbench verify-apex --source "$hardened" --output "$output"
printf 'Controlled Apex transition reproduced.\n'
