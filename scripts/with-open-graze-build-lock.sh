#!/bin/sh
set -eu

LOCK_DIR="${TMPDIR:-/tmp}/open-graze-next-build.lock"
WAIT_SEC="${OPEN_GRAZE_BUILD_LOCK_WAIT_SEC:-180}"

cleanup() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}

acquired=0
elapsed=0
while [ "$acquired" -eq 0 ]; do
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    acquired=1
    trap cleanup EXIT INT TERM
    break
  fi
  if [ "$elapsed" -ge "$WAIT_SEC" ]; then
    echo "open-graze build lock timeout: ${WAIT_SEC}s" >&2
    exit 1
  fi
  sleep 1
  elapsed=$((elapsed + 1))
done

"$@"
