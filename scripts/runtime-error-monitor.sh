#!/usr/bin/env bash
# Read runtime server logs from stdin, forward to stdout,
# and append actionable errors to .ralph/errors.log for Ralph recovery loop.

set -euo pipefail

ROOT="${1:-$(pwd)}"
RALPH_DIR="$ROOT/.ralph"
ERRORS_LOG="$RALPH_DIR/errors.log"
ACTIVITY_LOG="$RALPH_DIR/activity.log"

mkdir -p "$RALPH_DIR"
touch "$ERRORS_LOG" "$ACTIVITY_LOG"

is_error_line() {
  local line="${1:-}"
  [[ "$line" =~ (Error:|TypeError:|ReferenceError:|SyntaxError:|Unhandled|EADDRINUSE|ECONNREFUSED|ECONNRESET|failed[[:space:]]to[[:space:]]compile|Next\.js[[:space:]]build[[:space:]]worker[[:space:]]exited) ]]
}

while IFS= read -r line; do
  printf '%s\n' "$line"

  if is_error_line "$line"; then
    ts="$(date '+%H:%M:%S')"
    printf '[%s] [runtime-release] %s\n' "$ts" "$line" >> "$ERRORS_LOG"
  fi
done
