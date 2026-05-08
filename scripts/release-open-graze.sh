#!/usr/bin/env bash
# OpenGraze release runner (Layer 08 — Release/Deploy/Debug)
# Invariants:
#   1) LISTEN port == OPEN_GRAZE_RELEASE_PORT (default 3000)
#   2) next start only (not the dev-mode server) on production .next output
#   3) Process cwd is an immutable timestamped snapshot under .release/open-graze/
#   4) Stderr/stdout piped through runtime-error-monitor → latest line in .ralph/errors.log

set -euo pipefail

# Override for tests only: OPEN_GRAZE_RELEASE_PORT=3xxx sh scripts/release-open-graze.sh
OPEN_GRAZE_RELEASE_PORT="${OPEN_GRAZE_RELEASE_PORT:-3000}"

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT/apps/open-graze"
RELEASE_ROOT="$ROOT/.release/open-graze"
LATEST_LINK="$RELEASE_ROOT/current"

mkdir -p "$RELEASE_ROOT"

echo "==> Build open-graze production artifacts"
cd "$ROOT"
npm run build -w open-graze

STAMP="$(date '+%Y%m%d-%H%M%S')"
SNAPSHOT_DIR="$RELEASE_ROOT/$STAMP"
if [ -e "$SNAPSHOT_DIR" ]; then
  # Immutable snapshot contract: never reuse an existing timestamp directory.
  SNAPSHOT_DIR="$RELEASE_ROOT/${STAMP}-$$"
fi
[ ! -e "$SNAPSHOT_DIR" ] || {
  echo "release-open-graze: invariant failed (snapshot path already exists: $SNAPSHOT_DIR)" >&2
  exit 1
}
echo "==> Create release snapshot: $SNAPSHOT_DIR"
mkdir "$SNAPSHOT_DIR"

# Minimal runtime set for next start
cp -R "$APP_DIR/.next" "$SNAPSHOT_DIR/.next"
cp -R "$APP_DIR/public" "$SNAPSHOT_DIR/public"
cp -R "$APP_DIR/content" "$SNAPSHOT_DIR/content"
cp "$APP_DIR/package.json" "$SNAPSHOT_DIR/package.json"
[ -f "$APP_DIR/.env" ] && cp "$APP_DIR/.env" "$SNAPSHOT_DIR/.env" || true
[ -f "$APP_DIR/next.config.js" ] && cp "$APP_DIR/next.config.js" "$SNAPSHOT_DIR/next.config.js" || true
[ -f "$APP_DIR/next.config.mjs" ] && cp "$APP_DIR/next.config.mjs" "$SNAPSHOT_DIR/next.config.mjs" || true
[ -f "$APP_DIR/next.config.ts" ] && cp "$APP_DIR/next.config.ts" "$SNAPSHOT_DIR/next.config.ts" || true

# next start 재로드 시 next.config.* 가 ./lib/load-env-files 를 require 함 — 스냅샷에 동일 경로 필요
mkdir -p "$SNAPSHOT_DIR/lib"
cp "$APP_DIR/lib/load-env-files.ts" "$SNAPSHOT_DIR/lib/load-env-files.ts"

# Workspace-level node_modules reuse (no install in snapshot)
ln -sfn "$ROOT/node_modules" "$SNAPSHOT_DIR/node_modules"

ln -sfn "$SNAPSHOT_DIR" "$LATEST_LINK"

echo "==> Ensure port $OPEN_GRAZE_RELEASE_PORT is free"
sh "$ROOT/scripts/kill-port.sh" "$OPEN_GRAZE_RELEASE_PORT"

echo "==> Start release server (port $OPEN_GRAZE_RELEASE_PORT, next start, snapshot cwd)"
cd "$SNAPSHOT_DIR"
export NODE_ENV=production
export PORT="$OPEN_GRAZE_RELEASE_PORT"
export RALPH_WORKSPACE_ROOT="$ROOT"

# Single source of truth: LISTEN port must match env (Next honors PORT; we also pass -p).
if [ "${PORT:-}" != "$OPEN_GRAZE_RELEASE_PORT" ]; then
  echo "release-open-graze: invariant failed (PORT must equal OPEN_GRAZE_RELEASE_PORT)" >&2
  exit 1
fi

echo "==> Layer 08 context (ops checklist — verify before trusting the server)"
echo "    LISTEN_PORT=$OPEN_GRAZE_RELEASE_PORT  (default 3000; kill-port + export PORT + next start -p)"
echo "    SNAPSHOT_DIR=$SNAPSHOT_DIR  (immutable copy; cwd for this process)"
echo "    CURRENT_SYMLINK=$LATEST_LINK -> $(readlink "$LATEST_LINK" 2>/dev/null || echo "?")"
echo "    SERVER_CMD=next start  NODE_ENV=$NODE_ENV  (production only, never dev mode)"
echo "    ERROR_SIGNAL=$ROOT/.ralph/errors.log  (single-line overwrite, tag [runtime-release])"
echo "    DEBUG_ROOT=$RALPH_WORKSPACE_ROOT  (repo root; not snapshot cwd)"
echo "==> Actionable ops checklist (run after server starts)"
echo "    sh \"$ROOT/scripts/open-graze-ops-checklist.sh\""
echo "    sh \"$ROOT/scripts/check-open-graze-release-runtime.sh\""
echo "    tail -n 1 \"$ROOT/.ralph/errors.log\" 2>/dev/null || echo \"(latest error signal 없음)\""
echo "    readlink \"$ROOT/.release/open-graze/current\""
echo "==> Runtime error monitor enabled (.ralph/errors.log; latest error only, overwrite)"
# -p must track PORT (already asserted equal to OPEN_GRAZE_RELEASE_PORT above).
node "$ROOT/node_modules/next/dist/bin/next" start -p "${PORT}" 2>&1 \
  | "$ROOT/scripts/runtime-error-monitor.sh" "$ROOT"
