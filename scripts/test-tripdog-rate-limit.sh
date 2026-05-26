#!/usr/bin/env bash
# Exercise Trip Dog failed-password rate limiting (5 failures / 15 min per IP).
#
# Usage:
#   npm run dev   # in another terminal
#   npm run test:rate-limit
#
# Production (replace with your site origin):
#   BASE_URL=https://zainchalisa.com npm run test:rate-limit
#
# Expect: attempts 1–5 → HTTP 401, attempt 6 → HTTP 429 + Retry-After header.
# Correct passwords are NOT counted toward the limit.

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5173}"
ENDPOINT="${BASE_URL%/}/api/tripdog/unlock"
WRONG_PASSWORD="${WRONG_PASSWORD:-__rate_limit_test_wrong__}"

echo "Target: $ENDPOINT"
echo "Sending 6 wrong-password unlock attempts..."
echo

got_429=0
for i in 1 2 3 4 5 6; do
  headers="$(mktemp)"
  body="$(mktemp)"
  code="$(curl -sS -o "$body" -D "$headers" -w '%{http_code}' \
    -X POST "$ENDPOINT" \
    -H 'Content-Type: application/json' \
    -H 'X-Requested-With: TripdogUnlock' \
    -d "{\"password\":\"${WRONG_PASSWORD}\"}")"

  retry_after="$(grep -i '^retry-after:' "$headers" | tr -d '\r' | cut -d' ' -f2- || true)"
  err="$(sed -n 's/.*"error"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$body" | head -1)"

  echo "── Attempt $i ──"
  echo "  HTTP $code"
  [[ -n "$retry_after" ]] && echo "  Retry-After: $retry_after"
  [[ -n "$err" ]] && echo "  error: $err"

  if [[ "$i" -le 5 && "$code" != "401" ]]; then
    echo "  ✗ Expected 401 on attempts 1–5" >&2
    rm -f "$headers" "$body"
    exit 1
  fi
  if [[ "$i" -eq 6 && "$code" == "429" ]]; then
    got_429=1
    if [[ -z "$retry_after" ]]; then
      echo "  ⚠ Got 429 but no Retry-After header" >&2
    fi
  fi
  if [[ "$i" -eq 6 && "$code" != "429" ]]; then
    echo "  ✗ Expected 429 on attempt 6 (got $code)" >&2
    rm -f "$headers" "$body"
    exit 1
  fi

  rm -f "$headers" "$body"
  echo
done

if [[ $got_429 -eq 1 ]]; then
  echo "✓ Application rate limit is working (429 on 6th failed attempt)."
else
  echo "✗ Rate limit did not trigger as expected." >&2
  exit 1
fi

echo
echo "Cloudflare WAF (if configured separately) is not tested by this script."
echo "In the dashboard: Security → WAF → your rate rule → Metrics, or trigger"
echo "more requests than the WAF threshold and look for a Cloudflare block page."
