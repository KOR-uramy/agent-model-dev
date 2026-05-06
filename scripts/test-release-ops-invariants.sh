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

grep -q '> "$ERRORS_LOG"' "$MON" \
  || fail "runtime-error-monitor.sh must overwrite errors.log (latest signal only)"
grep -q 'is_error_line' "$MON" || fail "runtime-error-monitor.sh must define is_error_line"

echo "OK: release ops invariants (port 3000 default, next start, snapshot, error signal loop)"
