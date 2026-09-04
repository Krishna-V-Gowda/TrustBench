#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
destination="${1:-$root/.subjects/apex-app.js}"
url="https://raw.githubusercontent.com/Krishna-V-Gowda/EDA-InsightLab-Apex/main/assets/js/app.js"
expected="a15f8c9830c2729392e02e54abe2c62a3caba885b08f3aba8b575d522a2ef395"

mkdir -p "$(dirname "$destination")"
curl --fail --location --silent --show-error "$url" --output "$destination"
actual="$(sha256sum "$destination" | awk '{print $1}')"
if [[ "$actual" != "$expected" ]]; then
  printf 'subject hash mismatch\nexpected: %s\nactual:   %s\n' "$expected" "$actual" >&2
  exit 1
fi
printf '%s\n' "$destination"
