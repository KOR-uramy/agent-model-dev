## Agent Thread2 Report

### What I changed
- Updated layer trigger calculation to use previous-stage unchecked checklist items (instead of current-stage checklist items).
- Aligned UI trigger description text with the same rule so API payload meaning and UI explanation are consistent.
- Updated layer docs `04~07` to explicitly state that the next stage trigger follows this stage's unchecked checklist.

### Files touched
- `apps/open-graze/lib/ralph-layer-flow.ts`
- `apps/open-graze/app/components/ralph-loop-showcase.tsx`
- `apps/open-graze/content/ralph-layers/04_usage_data.md`
- `apps/open-graze/content/ralph-layers/05_presentation_builder.md`
- `apps/open-graze/content/ralph-layers/06_presentation_data.md`
- `apps/open-graze/content/ralph-layers/07_ui.md`
- `.ralph/parallel/1778240317-427c6d61/agent-thread2.md`

### How to run tests
- `npm run lint -w open-graze -- app/components/ralph-loop-showcase.tsx lib/ralph-layer-flow.ts`

### Gotchas
- Current checklist items in layers `04~07` are all checked, so trigger counts for downstream stages will often be `0` until unchecked items are intentionally added by the previous stage owner.
