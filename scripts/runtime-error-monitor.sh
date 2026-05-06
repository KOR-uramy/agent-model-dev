#!/usr/bin/env bash
# Read runtime server logs from stdin, forward to stdout,
# and keep only the latest actionable error in .ralph/errors.log (single line, overwrite).

set -euo pipefail

ROOT="${1:-$(pwd)}"
RALPH_DIR="$ROOT/.ralph"
ERRORS_LOG="$RALPH_DIR/errors.log"
# Prefix matches release-open-graze.sh / RALPH_TASK error-recovery hints
SIGNAL_TAG="${RUNTIME_ERROR_SIGNAL_TAG:-runtime-release}"

mkdir -p "$RALPH_DIR"
touch "$ERRORS_LOG"

# POSIX ERE (works under /bin/sh); keep in sync with Layer 08 docs / invariant tests.
_ERROR_PATTERN='Error:|TypeError:|ReferenceError:|SyntaxError:|Unhandled|EADDRINUSE|ECONNREFUSED|ECONNRESET|\[Error\]|Error[[:space:]]+occurred|Internal[[:space:]]+Server[[:space:]]+Error|(failed|Failed)[[:space:]]+to[[:space:]]+compile|Next\.js[[:space:]]+build[[:space:]]+worker[[:space:]]+exited'

is_error_line() {
  line="${1-}"
  [ -n "$line" ] || return 1
  printf '%s\n' "$line" | grep -qE "$_ERROR_PATTERN"
}

while IFS= read -r line; do
  printf '%s\n' "$line"

  if is_error_line "$line"; then
    ts="$(date '+%H:%M:%S')"
    printf '[%s] [%s] %s\n' "$ts" "$SIGNAL_TAG" "$line" > "$ERRORS_LOG"
  fi
done
