#!/usr/bin/env bash
# OpenGraze release runner
# - Always uses port 3000
# - Always serves built artifacts (next start)
# - Runs from immutable snapshot dir to avoid dev hotfix edits affecting live process

set -euo pipefail

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT/apps/open-graze"
RELEASE_ROOT="$ROOT/.release/open-graze"
STAMP="$(date '+%Y%m%d-%H%M%S')"
SNAPSHOT_DIR="$RELEASE_ROOT/$STAMP"
LATEST_LINK="$RELEASE_ROOT/current"

mkdir -p "$RELEASE_ROOT"

echo "==> Build open-graze production artifacts"
cd "$ROOT"
npm run build -w open-graze

echo "==> Create release snapshot: $SNAPSHOT_DIR"
mkdir -p "$SNAPSHOT_DIR"

# Minimal runtime set for next start
cp -R "$APP_DIR/.next" "$SNAPSHOT_DIR/.next"
cp -R "$APP_DIR/public" "$SNAPSHOT_DIR/public"
cp "$APP_DIR/package.json" "$SNAPSHOT_DIR/package.json"
[ -f "$APP_DIR/.env" ] && cp "$APP_DIR/.env" "$SNAPSHOT_DIR/.env" || true
[ -f "$APP_DIR/next.config.js" ] && cp "$APP_DIR/next.config.js" "$SNAPSHOT_DIR/next.config.js" || true
[ -f "$APP_DIR/next.config.mjs" ] && cp "$APP_DIR/next.config.mjs" "$SNAPSHOT_DIR/next.config.mjs" || true

# Workspace-level node_modules reuse (no install in snapshot)
ln -sfn "$ROOT/node_modules" "$SNAPSHOT_DIR/node_modules"

ln -sfn "$SNAPSHOT_DIR" "$LATEST_LINK"

echo "==> Ensure port 3000 is free"
sh "$ROOT/scripts/kill-port.sh" 3000

echo "==> Start release server (port 3000, built files only)"
cd "$SNAPSHOT_DIR"
export NODE_ENV=production
export PORT=3000
echo "==> Runtime error monitor enabled (.ralph/errors.log)"
node "$ROOT/node_modules/next/dist/bin/next" start -p 3000 2>&1 \
  | "$ROOT/scripts/runtime-error-monitor.sh" "$ROOT"
