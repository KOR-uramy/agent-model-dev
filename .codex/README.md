# Codex Ralph Scripts

This directory is the Codex CLI clone of the repo's Cursor Ralph setup.

## Entry Points

- `.codex/ralph-scripts/ralph-loop.sh`
- `.codex/ralph-scripts/ralph-setup.sh`
- `.codex/ralph-scripts/ralph-parallel.sh`

## Differences From `.cursor/ralph-scripts`

- Uses `codex exec` instead of Cursor `agent` / `cursor-agent`
- Defaults `RALPH_MODEL` to `gpt-5.2` unless overridden
- Uses your normal Codex login/session state by default (`~/.codex`)
- Supports an optional isolated `RALPH_CODEX_HOME` override when you explicitly want it
- Treats each iteration as a fresh Codex run instead of relying on Cursor `--resume`

## Basic Usage

```bash
cd /Users/uram/dev/agent-model-dev/apps/open-graze
../../.codex/ralph-scripts/ralph-loop.sh -y
```

Optional overrides:

```bash
export RALPH_MODEL=gpt-5.4
export RALPH_CODEX_HOME="$PWD/.ralph/codex-home"
../../.codex/ralph-scripts/ralph-loop.sh -y --infinite
```
