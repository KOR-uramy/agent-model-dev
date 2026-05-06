# Agent thread1 (Core 1~3) — 작업 보고

## 변경 요약

- **레이어 md (`01`~`03`)**: `RALPH_TASK.md`, `.ralph/progress.md`, `.codex/ralph-scripts/`, `layer-flow` API와의 연동을 표로 정리하고, **다음 핸드오프용 미완 체크리스트 `[ ]`**를 보강했다. 실제 함수명은 스크립트와 맞추어 `ralph_role_for_iteration`으로 기술했다.
- **`GET /api/ralph/layer-flow`**: `flow.coreSourcing` 객체를 추가해 Need/Action/Capability 필드가 각각 어떤 파일 규칙에서 오는지 노출한다. `RALPH_TASK.md`, `progress.md`, `ralph-common.sh` 읽기 실패 시 전체 500 대신 해당 필드에 진단 문구를 채우도록 방어 로직을 넣었다. Capability 요약은 `ralph_role_for_iteration()` 존재 여부를 우선 판별한다.
- **`ralph-loop-showcase`**: 헤더 카피를 `Capability + Business Logic`으로 통일하고, `coreSourcing` 요약·`workspaceRoot`를 표시한다. 레이어 md 그리드 순서를 **Core → Presentation → Ops**로 정렬했다.

## 수정·추가한 파일

- `apps/open-graze/content/ralph-layers/01_need.md`
- `apps/open-graze/content/ralph-layers/02_action.md`
- `apps/open-graze/content/ralph-layers/03_capability_business_logic.md`
- `apps/open-graze/app/api/ralph/layer-flow/route.ts`
- `apps/open-graze/app/components/ralph-loop-showcase.tsx`
- `.ralph/parallel/1778082328-fd505ca3/agent-thread1.md` (본 문서)

## 테스트 실행

- 루트: `npm run build` (workspace: `ralph-workspace-sdk` + `open-graze`) — 통과함.
- 선택: 서버 기동 후 `npm run runtime:smoke` (루트). 별도 단위 테스트 스위트는 추가하지 않음.

## 주의사항

- 병렬 과제 지시에 따라 **`.ralph/progress.md`는 수정하지 않았다.** API는 여전히 해당 파일을 읽는다.
- **`RALPH_TASK.md`는 orchestrator 전용으로 변경하지 않았다.**
- **`flow.coreSourcing.workspaceRoot`**는 디버깅용으로 UI에 노출된다. 민감한 경로가 걱정되면 후속 이슈에서 마스킹 또는 관리자 전용으로 옮길 수 있다.
