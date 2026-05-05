#!/bin/bash
# Cursor shim: delegate to .codex implementation.

_SCRIPT_DIR_CURSOR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_REPO_ROOT="$(cd "$_SCRIPT_DIR_CURSOR/../.." && pwd)"
exec "$_REPO_ROOT/.codex/ralph-scripts/stream-parser.sh" "$@"
