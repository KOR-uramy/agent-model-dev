#!/usr/bin/env sh
# Runtime checklist for OpenGraze Layer 08 release process.
# Verifies port/listener command, snapshot cwd, and latest error signal visibility.

set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
RELEASE_ROOT="$ROOT/.release/open-graze"
CURRENT_LINK="$ROOT/.release/open-graze/current"
PORT="${OPEN_GRAZE_RELEASE_PORT:-3000}"
ERRORS_LOG="$ROOT/.ralph/errors.log"
SIGNAL_TAG="${RUNTIME_ERROR_SIGNAL_TAG:-runtime-release}"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

pass() {
  echo "OK: $1"
}

resolve_path() {
  target="${1-}"
  [ -n "$target" ] || return 1
  [ -e "$target" ] || return 1
  (CDPATH= cd -- "$target" && pwd -P)
}

if [ ! -L "$CURRENT_LINK" ]; then
  fail "missing current symlink: $CURRENT_LINK"
fi

CURRENT_DIR="$(resolve_path "$CURRENT_LINK")" || fail "cannot resolve current symlink target"
case "$CURRENT_DIR" in
  "$RELEASE_ROOT"/*) : ;;
  *) fail "current symlink target must be under $RELEASE_ROOT (got: $CURRENT_DIR)" ;;
esac
pass "current symlink points to snapshot: $CURRENT_DIR"

if ! command -v lsof >/dev/null 2>&1; then
  fail "lsof is required for runtime checklist"
fi

LISTEN_PID="$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null | awk 'NR==1{print $1}')"
[ -n "$LISTEN_PID" ] || fail "no LISTEN process on port $PORT"
pass "port $PORT has LISTEN process pid=$LISTEN_PID"

CMDLINE="$(ps -p "$LISTEN_PID" -o command= 2>/dev/null || true)"
[ -n "$CMDLINE" ] || fail "cannot inspect command line for pid=$LISTEN_PID"
echo "$CMDLINE" | grep -q 'next' || fail "listener pid=$LISTEN_PID is not a next process"
echo "$CMDLINE" | grep -q 'start' || fail "listener pid=$LISTEN_PID is not running next start"
pass "listener command uses next start"

PID_CWD_RAW="$(lsof -a -p "$LISTEN_PID" -d cwd -Fn 2>/dev/null | awk 'BEGIN{FS="n"} /^n/{print $2; exit}')"
[ -n "$PID_CWD_RAW" ] || fail "cannot resolve cwd for pid=$LISTEN_PID"
PID_CWD="$(resolve_path "$PID_CWD_RAW")" || fail "cannot canonicalize listener cwd"
[ "$PID_CWD" = "$CURRENT_DIR" ] || fail "listener cwd mismatch (pid cwd=$PID_CWD, current=$CURRENT_DIR)"
pass "listener cwd matches immutable snapshot current target"

if [ ! -f "$ERRORS_LOG" ]; then
  fail "missing latest error signal file: $ERRORS_LOG"
fi

LAST_ERROR_LINE="$(awk 'NF{line=$0} END{print line}' "$ERRORS_LOG")"
if [ -n "$LAST_ERROR_LINE" ]; then
  echo "$LAST_ERROR_LINE" | grep -Fq "[$SIGNAL_TAG]" \
    || fail "latest error line should include signal tag [$SIGNAL_TAG]"
  pass "latest error signal line is tagged and readable"
else
  echo "WARN: errors.log is empty (no matching runtime error seen yet)"
fi

echo "OK: release runtime checklist complete (port $PORT, next start, snapshot cwd, latest error signal)"
