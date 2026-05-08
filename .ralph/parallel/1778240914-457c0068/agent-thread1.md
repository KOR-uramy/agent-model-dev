## Agent Thread1 Report (Core, Layers 1~3)

### What I changed
- `apps/open-graze/lib/ralph-layer-flow.ts`에 core(1~3) 정합성 보강용 필드를 확장하고, 관련 placeholder/타입을 단일 모듈에서 상수로 정의했습니다.
  - `flow.actionItems: string[]` — 02_action.md 미완 체크리스트 상위 1~3개를 우선순위(작성 순서) 그대로 노출. `flow.action`은 `actionItems[0]`과 동일하게 유지해 백워드 호환을 보장.
  - `flow.capabilityLogicStructured: { policy, constraints, errorHandling }` — 03 미완 항목/사이클·자동확장 설정/에러 우선 복구 정책을 3축으로 구조화. 기존 `flow.capabilityLogic` 문자열은 그대로 유지.
  - `flow.coreIntegrity: { ok, issues, fields }` — Need/Action/CapabilityLogic 각 필드가 placeholder 없이 실데이터로 채워졌는지 운영 검증 결과를 노출. UI/SSE 소비자가 `ok=false`일 때 즉시 1~3 보강이 필요함을 인지 가능.
  - 상수화: `CORE_ACTION_ITEMS_MAX`, `ACTION_PLACEHOLDER`, `CAPABILITY_PLACEHOLDER` (KISS/매직 스트링 제거).
  - 데드 코드(미사용 `resolveActionFromLayer`) 제거.
- `apps/open-graze/content/ralph-layers/01_need.md`
  - 운영 검증(`flow.coreIntegrity`) 추가 완료 항목을 `[x]`로 마킹.
  - 다음 핸드오프 `[ ]`: `coreIntegrity.ok === false` 핸드오프를 SSE 스트림 소비자가 차단/경고하도록 반영.
- `apps/open-graze/content/ralph-layers/02_action.md`
  - 다중 미완 항목(상위 1~3개) 노출 항목을 `[x]`로 마킹.
  - 다음 핸드오프 `[ ]`: 쇼케이스 Stage 2 카드가 `flow.actionItems`를 우선순위 리스트로 렌더하고 핸드오프 책임자(core)를 라벨링.
- `apps/open-graze/content/ralph-layers/03_capability_business_logic.md`
  - capabilityLogic 구조화 항목(`policy`/`constraints`/`errorHandling`)을 `[x]`로 마킹.
  - 다음 핸드오프 `[ ]`: `errorHandling`이 `.ralph/errors.log` 활성 신호에 따라 동적으로 바뀌도록 정책 확장.

### Files touched
- `apps/open-graze/lib/ralph-layer-flow.ts`
- `apps/open-graze/content/ralph-layers/01_need.md`
- `apps/open-graze/content/ralph-layers/02_action.md`
- `apps/open-graze/content/ralph-layers/03_capability_business_logic.md`
- `.ralph/parallel/1778240914-457c0068/agent-thread1.md`

### How to run tests
- 타입 체크 (실행 완료, 깨끗): `cd apps/open-graze && npx tsc --noEmit -p tsconfig.json`
- 린트 (실행 완료, 깨끗): `cd apps/open-graze && npx eslint lib/ralph-layer-flow.ts`
- 런타임 스모크 (서버 기동 후 선택): `cd apps/open-graze && npm run dev` → 다른 터미널에서 `npm run runtime:smoke`
- core 정합성 수동 확인: `curl -s http://127.0.0.1:3000/api/ralph/layer-flow | jq '.flow | {need, actionItems, capabilityLogicStructured, coreIntegrity}'`

### Gotchas
- `flow.actionItems` / `flow.capabilityLogicStructured` / `flow.coreIntegrity`는 신규 필드이며 기존 필드는 모두 보존되었으니, presentation thread(쇼케이스 UI 타입 정의)는 다음 사이클에서 선택적 필드로 추가하기만 하면 됩니다(쇼케이스 코드는 이번 커밋에서 건드리지 않음).
- 시작 시 워크트리 디렉터리(`.ralph-worktrees/1778240914-457c0068-thread1`)가 `git worktree list`에 등록돼 있지 않아 사실상 main 리포지토리에서 작업되었습니다. 동시 실행 thread2/3 와 충돌을 피하기 위해 본 작업은 layers 1~3 관련 4개 파일과 보고서로만 한정했습니다.
- 작업 시작 시점 디스크 잔여 122MiB → 작업 중 1.3GiB로 회복(다른 프로세스/정리). 차후 루프에서 디스크 모니터링 권장.
