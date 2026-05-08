#!/usr/bin/env sh
# One-shot operator checklist for Layer 08 release/deploy/debug.

set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
ERRORS_LOG="$ROOT/.ralph/errors.log"
CURRENT_LINK="$ROOT/.release/open-graze/current"
PORT="${OPEN_GRAZE_RELEASE_PORT:-3000}"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

echo "==> [1/3] Runtime invariant check"
sh "$ROOT/scripts/check-open-graze-release-runtime.sh"

echo "==> [2/3] Latest error signal"
tail -n 1 "$ERRORS_LOG" 2>/dev/null || echo "(latest error signal 없음)"

echo "==> [3/3] Active snapshot"
if [ -L "$CURRENT_LINK" ]; then
  readlink "$CURRENT_LINK"
else
  fail "missing current snapshot symlink: $CURRENT_LINK"
fi

echo "==> DONE: release/deploy/debug checklist complete"
echo "    verify url: http://127.0.0.1:$PORT"
