## Agent Thread1 Report

### What I changed
- Implemented core handoff warning signaling in SSE: `/api/ralph/layer-flow/stream` now emits `core-integrity-warning` when `flow.coreIntegrity.ok === false`.
- Updated core consumer UI (`RalphLoopShowcase`) to consume core-integrity warning events and render a visible handoff warning.
- Updated Stage 2 UI to render `flow.actionItems` as a priority list (top 1~3) with per-item `Core Thread` ownership labels.
- Extended Capability+Business Logic computation so `flow.capabilityLogicStructured.errorHandling` changes dynamically based on active `.ralph/errors.log` signal presence.
- Updated layer docs (`01~03`) by checking off completed items and adding new unchecked next-handoff checklist items.

### Files touched
- `apps/open-graze/lib/ralph-layer-flow.ts`
- `apps/open-graze/app/api/ralph/layer-flow/stream/route.ts`
- `apps/open-graze/app/components/ralph-loop-showcase.tsx`
- `apps/open-graze/content/ralph-layers/01_need.md`
- `apps/open-graze/content/ralph-layers/02_action.md`
- `apps/open-graze/content/ralph-layers/03_capability_business_logic.md`
- `.ralph/parallel/1778241666-334ab6c3/agent-thread1.md`

### How to run tests
- `npm run build -w open-graze`

### Gotchas
- The assigned isolated worktree path (`.ralph-worktrees/1778241666-334ab6c3-thread1`) contained only `.ralph` and no source tree, so implementation was performed in the main repository worktree.
- `core-integrity-warning` is additive SSE signaling; existing `layer-flow` event consumers remain backward-compatible.
