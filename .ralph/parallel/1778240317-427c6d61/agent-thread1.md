## Agent Thread1 Report

### What I changed
- Core layer(1~3) 정합성을 위해 `layer-flow`가 Need/Action/Capability를 레이어 문서 체크리스트 중심으로 계산하도록 수정했습니다.
- Need 출처 우선순위를 `app_need.txt > 01_need.md 미완 항목 > RALPH_TASK.md 미완 항목 > empty`로 반영했습니다.
- Action은 `.ralph/progress.md` 의존을 제거하고 `02_action.md` 미완 체크리스트에서 직접 읽도록 변경했습니다.
- Capability 요약에 `03_capability_business_logic.md`의 미완 항목을 우선 규칙으로 포함했습니다.
- 레이어 문서 `01~03`에 현재 완료 항목(`[x]`)과 다음 핸드오프용 미완 항목(`[ ]`)을 갱신했습니다.
- 쇼케이스 UI 타입/라벨에 새 Need 소스(`layer_doc`)를 반영했습니다.

### Files touched
- `apps/open-graze/lib/ralph-layer-flow.ts`
- `apps/open-graze/app/components/ralph-loop-showcase.tsx`
- `apps/open-graze/content/ralph-layers/01_need.md`
- `apps/open-graze/content/ralph-layers/02_action.md`
- `apps/open-graze/content/ralph-layers/03_capability_business_logic.md`
- `.ralph/parallel/1778240317-427c6d61/agent-thread1.md`

### How to run tests
- `cd apps/open-graze`
- `npm run lint`

### Gotchas
- `needSource` 타입이 확장되어(`layer_doc`) 이를 소비하는 컴포넌트/타입 정의가 함께 업데이트되어야 합니다.
- Action 데이터는 더 이상 `.ralph/progress.md`를 보지 않으므로, core thread 실행 입력은 `02_action.md`의 미완 항목 관리가 기준입니다.
