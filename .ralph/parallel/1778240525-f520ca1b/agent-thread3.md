# Agent Thread3 Report (Layer 08: Release/Deploy/Debug)

## What I changed
- Fixed a deployment/debug checklist consistency bug in `scripts/release-open-graze.sh`:
  - The script switches cwd to an immutable snapshot before startup.
  - The printed "Actionable ops checklist" commands used relative paths (`scripts/...`, `.ralph/...`, `.release/...`) that can fail when pasted from snapshot cwd.
  - Updated checklist output to use repo-root absolute paths via `$ROOT`, so operators can run checks from any cwd.
- Strengthened static invariant coverage in `scripts/test-release-ops-invariants.sh`:
  - Added assertions that checklist output includes root-anchored commands for:
    - runtime checklist runner
    - latest error signal tail
    - current snapshot symlink inspection

## Files touched
- `scripts/release-open-graze.sh`
- `scripts/test-release-ops-invariants.sh`
- `.ralph/parallel/1778240525-f520ca1b/agent-thread3.md`

## How to run tests
- From repo root:
  - `sh scripts/test-release-ops-invariants.sh`

Expected:
- `OK: release ops invariants (port 3000 default, next start, snapshot, error signal loop, runtime checklist)`

## Gotchas
- `scripts/release-open-graze.sh` intentionally runs from snapshot cwd (`.release/open-graze/<stamp>`). Any operator guidance printed by that script must be root-anchored (or explicitly prefixed with `cd "$ROOT"`), otherwise copy-paste checks can fail.
- This work only changes Layer 08 release/debug pipeline scripts and static checks; it does not change app runtime behavior beyond making ops commands reliably executable.
