#!/bin/bash
# Cursor shim: delegate to .codex implementation.

if [[ -z "${RALPH_MODEL:-}" ]]; then
  export RALPH_MODEL="${RALPH_CURSOR_DEFAULT_MODEL:-auto}"
fi

_SCRIPT_DIR_CURSOR_COMMON="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_REPO_ROOT="$(cd "$_SCRIPT_DIR_CURSOR_COMMON/../.." && pwd)"
source "$_REPO_ROOT/.codex/ralph-scripts/ralph-common.sh"
