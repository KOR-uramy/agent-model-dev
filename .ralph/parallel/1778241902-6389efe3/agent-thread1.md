## Agent Thread1 Report

### What I changed
- Layer 2 schema draft implemented in `flow.actionItemDrafts` with `text/status/owner` shape.
- `actionItemDrafts` status defaults are now deterministic (`in_progress` for top priority, then `pending`).
- Layer 3 capability logic now binds `flow.capabilityLogicStructured.errorHandling` to Layer 8 `releaseDebug` signal.
- Recovery-first policy text now explicitly documents 단계: `탐지 → 분류 → 복구 → 검증`.
- Layer docs updated: completed Layer 2/3 checklist items and added new unchecked handoff items.

### Files touched
- `apps/open-graze/lib/ralph-layer-flow.ts`
- `apps/open-graze/content/ralph-layers/02_action.md`
- `apps/open-graze/content/ralph-layers/03_capability_business_logic.md`
- `.ralph/parallel/1778241902-6389efe3/agent-thread1.md`

### How to run tests
- `npm run build -w open-graze`

### Gotchas
- `actionItemDrafts` is a draft schema for Stage 2; UI consumption is intentionally left as next handoff work.
- `done` status is currently reserved in type only; no auto-completion inference is applied yet.
