#!/usr/bin/env sh
# Static checks: OpenGraze release pipeline matches Layer 08 invariants.
# Run from repo root: sh scripts/test-release-ops-invariants.sh

set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
REL="$ROOT/scripts/release-open-graze.sh"
MON="$ROOT/scripts/runtime-error-monitor.sh"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

grep -Fq 'OPEN_GRAZE_RELEASE_PORT="${OPEN_GRAZE_RELEASE_PORT:-3000}"' "$REL" \
  || fail "release-open-graze.sh must default OPEN_GRAZE_RELEASE_PORT to 3000"
grep -E 'next[[:space:]]+dev' "$REL" >/dev/null 2>&1 \
  && fail "release-open-graze.sh must not invoke the dev server (next dev)"
grep -Fq 'next" start' "$REL" \
  || fail "release-open-graze.sh must run next start"
grep -Fq 'kill-port.sh" "$OPEN_GRAZE_RELEASE_PORT"' "$REL" \
  || fail "release-open-graze.sh must free OPEN_GRAZE_RELEASE_PORT via kill-port"
grep -q 'mkdir -p "$SNAPSHOT_DIR"' "$REL" \
  || fail "release-open-graze.sh must create timestamped snapshot"
grep -q 'runtime-error-monitor.sh' "$REL" \
  || fail "release-open-graze.sh must pipe logs through runtime-error-monitor"
grep -q 'next.config.ts' "$REL" \
  || fail "release-open-graze.sh must copy next.config.ts when present"
grep -Fq 'export NODE_ENV=production' "$REL" \
  || fail "release-open-graze.sh must export NODE_ENV=production"
grep -Fq 'export PORT="$OPEN_GRAZE_RELEASE_PORT"' "$REL" \
  || fail "release-open-graze.sh must export PORT from OPEN_GRAZE_RELEASE_PORT"
grep -Fq 'LATEST_LINK="$RELEASE_ROOT/current"' "$REL" \
  || fail "release-open-graze.sh must define LATEST_LINK under .release/open-graze"
grep -Fq 'ln -sfn "$SNAPSHOT_DIR" "$LATEST_LINK"' "$REL" \
  || fail "release-open-graze.sh must refresh current symlink to the new snapshot"
grep -Fq 'PORT must equal OPEN_GRAZE_RELEASE_PORT' "$REL" \
  || fail "release-open-graze.sh must guard PORT vs OPEN_GRAZE_RELEASE_PORT alignment"

grep -q '> "$ERRORS_LOG"' "$MON" \
  || fail "runtime-error-monitor.sh must overwrite errors.log (latest signal only)"
grep -q 'is_error_line' "$MON" || fail "runtime-error-monitor.sh must define is_error_line"

# Behavioral: latest error overwrites previous (temp workspace root)
TMP="$(mktemp -d)"
trap "rm -rf \"$TMP\"" EXIT
printf '%s\n' 'info line' 'Error: first failure' \
  | RUNTIME_ERROR_SIGNAL_TAG=ops-invariant-test sh "$MON" "$TMP" >/dev/null 2>&1 \
  || fail "runtime-error-monitor.sh exited non-zero on stdin test"
grep -Fq '[ops-invariant-test]' "$TMP/.ralph/errors.log" \
  || fail "errors.log should record SIGNAL_TAG from monitor"
grep -Fq 'Error: first failure' "$TMP/.ralph/errors.log" \
  || fail "errors.log should contain the matched error line"
printf '%s\n' 'Error: second failure' \
  | RUNTIME_ERROR_SIGNAL_TAG=ops-invariant-test sh "$MON" "$TMP" >/dev/null 2>&1 \
  || fail "runtime-error-monitor second pass failed"
grep -Fq 'Error: second failure' "$TMP/.ralph/errors.log" \
  || fail "errors.log should show the latest error"
grep -Fq 'Error: first failure' "$TMP/.ralph/errors.log" \
  && fail "errors.log must not accumulate; first error should be overwritten"

echo "OK: release ops invariants (port 3000 default, next start, snapshot, error signal loop)"
