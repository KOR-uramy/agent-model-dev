#!/usr/bin/env sh
# Static checks: OpenGraze release pipeline matches Layer 08 invariants.
# Run from repo root: sh scripts/test-release-ops-invariants.sh

set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
REL="$ROOT/scripts/release-open-graze.sh"
MON="$ROOT/scripts/runtime-error-monitor.sh"
CHK="$ROOT/scripts/check-open-graze-release-runtime.sh"
OPS="$ROOT/scripts/open-graze-ops-checklist.sh"

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
grep -Eq 'mkdir[[:space:]]+"\$SNAPSHOT_DIR"' "$REL" \
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
grep -Fq 'cd "$SNAPSHOT_DIR"' "$REL" \
  || fail "release-open-graze.sh must cd into the snapshot before next start"
grep -Fq 'export RALPH_WORKSPACE_ROOT="$ROOT"' "$REL" \
  || fail "release-open-graze.sh must export RALPH_WORKSPACE_ROOT for workspace-scoped debug"
grep -Fq '.ralph/errors.log' "$REL" \
  || fail "release-open-graze.sh must reference .ralph/errors.log in operator output"
grep -Fq 'Layer 08 context' "$REL" \
  || fail "release-open-graze.sh must print Layer 08 context (ops checklist hook)"
grep -Fq 'Actionable ops checklist' "$REL" \
  || fail "release-open-graze.sh must print actionable ops checklist commands"
grep -Fq 'sh \"$ROOT/scripts/open-graze-ops-checklist.sh\"' "$REL" \
  || fail "release-open-graze.sh must print one-shot ops checklist command"
grep -Fq 'sh \"$ROOT/scripts/check-open-graze-release-runtime.sh\"' "$REL" \
  || fail "release-open-graze.sh must print runtime checklist with repo-root absolute path"
grep -Fq 'tail -n 1 \"$ROOT/.ralph/errors.log\"' "$REL" \
  || fail "release-open-graze.sh must print latest error signal check with repo-root path"
grep -Fq 'readlink \"$ROOT/.release/open-graze/current\"' "$REL" \
  || fail "release-open-graze.sh must print current snapshot check with repo-root path"
grep -Fq 'DEBUG_ROOT=$RALPH_WORKSPACE_ROOT' "$REL" \
  || fail "release-open-graze.sh must print DEBUG_ROOT for workspace vs snapshot cwd"
grep -Fq 'production only, never dev mode' "$REL" \
  || fail "release-open-graze.sh must remind operators that dev mode is not used"
grep -Fq 'next" start -p "${PORT}"' "$REL" \
  || fail "release-open-graze.sh must pass next start -p from PORT (aligned with OPEN_GRAZE_RELEASE_PORT)"
grep -Fq '[ ! -e "$SNAPSHOT_DIR" ] || {' "$REL" \
  || fail "release-open-graze.sh must fail when snapshot path already exists (immutable snapshot)"

[ -f "$CHK" ] || fail "runtime checklist script is missing: $CHK"
[ -x "$CHK" ] || fail "runtime checklist script must be executable: $CHK"
[ -f "$OPS" ] || fail "ops checklist script is missing: $OPS"
[ -x "$OPS" ] || fail "ops checklist script must be executable: $OPS"
grep -Fq 'check-open-graze-release-runtime.sh' "$OPS" \
  || fail "ops checklist must execute runtime checklist first"
grep -Fq 'tail -n 1 "$ERRORS_LOG"' "$OPS" \
  || fail "ops checklist must expose latest error signal line"
grep -Fq 'readlink "$CURRENT_LINK"' "$OPS" \
  || fail "ops checklist must print active snapshot link"
grep -Fq 'OPEN_GRAZE_RELEASE_PORT:-3000' "$CHK" \
  || fail "runtime checklist must default OPEN_GRAZE_RELEASE_PORT to 3000"
grep -Fq 'next start' "$CHK" \
  || fail "runtime checklist must verify next start process"
grep -Fq '.release/open-graze/current' "$CHK" \
  || fail "runtime checklist must validate current snapshot symlink"
grep -Fq '.ralph/errors.log' "$CHK" \
  || fail "runtime checklist must check latest error signal file"

grep -q '> "$ERRORS_LOG"' "$MON" \
  || fail "runtime-error-monitor.sh must overwrite errors.log (latest signal only)"
grep -q 'is_error_line' "$MON" || fail "runtime-error-monitor.sh must define is_error_line"
grep -q '_ERROR_PATTERN' "$MON" \
  || fail "runtime-error-monitor.sh must centralize the error ERE in _ERROR_PATTERN"
grep -Fq 'SIGNAL_TAG="${RUNTIME_ERROR_SIGNAL_TAG:-runtime-release}"' "$MON" \
  || fail "runtime-error-monitor.sh must default SIGNAL_TAG to runtime-release"

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
lines="$(wc -l < "$TMP/.ralph/errors.log" | tr -d ' ')"
[ "$lines" = 1 ] || fail "errors.log must be exactly one line (latest signal only), got $lines"

printf '%s\n' 'non-error noise only' \
  | RUNTIME_ERROR_SIGNAL_TAG=ops-invariant-test sh "$MON" "$TMP" >/dev/null 2>&1 \
  || fail "runtime-error-monitor should accept stdin with no error patterns"
grep -Fq 'Error: second failure' "$TMP/.ralph/errors.log" \
  || fail "errors.log should be unchanged when no new error line matches"
lines2="$(wc -l < "$TMP/.ralph/errors.log" | tr -d ' ')"
[ "$lines2" = 1 ] || fail "errors.log must stay single-line after non-error stdin, got $lines2"

echo "OK: release ops invariants (port 3000 default, next start, snapshot, error signal loop, runtime checklist)"
