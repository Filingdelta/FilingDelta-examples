#!/usr/bin/env bash
# Free tour. No wallet and no payment.
# Expects 200 from the free routes, then 402 plus PAYMENT-REQUIRED on /delta/AMD.
set -euo pipefail

base="${FILINGDELTA_BASE:-https://filingdelta.xyz}"
base="${base%/}"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

expect_200() {
  local path="$1"
  local code
  code="$(curl -sS -o "$tmpdir/body" -w "%{http_code}" "$base$path")"
  if [[ "$code" != "200" ]]; then
    echo "expected 200 from $path, got $code" >&2
    exit 1
  fi
  echo "200 $path"
}

expect_200 /catalog
expect_200 /sample/AMD
expect_200 /sample/policy/FED
expect_200 /sample/history/AMD
expect_200 /updates

code="$(curl -sS -D "$tmpdir/delta.hdr" -o "$tmpdir/delta.body" -w "%{http_code}" "$base/delta/AMD")"
if [[ "$code" != "402" ]]; then
  echo "expected 402 from /delta/AMD, got $code" >&2
  exit 1
fi
if ! grep -iq '^payment-required:' "$tmpdir/delta.hdr"; then
  echo "402 from /delta/AMD had no PAYMENT-REQUIRED header" >&2
  exit 1
fi
echo "402 /delta/AMD PAYMENT-REQUIRED"
