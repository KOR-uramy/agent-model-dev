# Agent thread1 (Core layers 1~3)

## 변경 요약

- **레이어 md**: `01_need.md`, `02_action.md`, `03_capability_business_logic.md`에 Core 스레드 소유·근거 경로·`RALPH_TASK.md`/`layer-flow`와의 정합 설명을 보강하고, 다음 핸드오프용 미완 체크리스트 `[ ]`를 추가·유지했다.
- **API**: `GET /api/ralph/layer-flow`에서 `.ralph/progress.md` 또는 `ralph-common.sh`가 없거나 읽기 실패해도 500으로 전체 플로우가 죽지 않도록 처리했다. `flow.action`·`flow.capabilityLogic`에 병렬/신규 클론 상황을 안내하는 문구를 반환한다.
- **capability 요약**: 역할 3단계 감지를 `% 3` 단순 포함이 아니라 `(iteration - 1) % 3` 패턴 및 planning/implementation/test·`RALPH_ROLE_MODE` 존재로 판별하도록 조정했다.

## 수정·추가한 파일

- `apps/open-graze/content/ralph-layers/01_need.md`
- `apps/open-graze/content/ralph-layers/02_action.md`
- `apps/open-graze/content/ralph-layers/03_capability_business_logic.md`
- `apps/open-graze/app/api/ralph/layer-flow/route.ts`
- `.ralph/parallel/1778082183-fc57e856/agent-thread1.md` (본 보고)

## 테스트 실행

- 루트: `npm run build` (워크스페이스 빌드; 본 변경 포함 검증)
- (선택) open-graze 개발 서버 기동 후 `GET /api/ralph/layer-flow` JSON에 `layers`·`flow.need`·`flow.action`·`flow.capabilityLogic` 확인

## 주의 (gotchas)

- **체크리스트 파싱**: API는 각 md **전체 본문**에서 `- [ ]` / `- [x]` 줄을 모두 수집한다. 1~3 md에 항목을 늘리면 `orchestration.*.pendingChecklist`와 다음 단계 트리거 수가 함께 늘어난다(의도된 동작).
- **`RALPH_TASK.md`**: 과제에서 명시대로 본 에이전트는 수정하지 않았다.
- **`.ralph/progress.md`**: 병렬 모드에서 스레드가 건드리지 않을 수 있음 → 이제 API는 실패 시 안내 문구로 대체한다.
