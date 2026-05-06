# Agent thread1 (Core 1~3) — 병렬 작업 보고

## 변경 요약

- 레이어 md(`01_need`, `02_action`, `03_capability_business_logic`)에 **실데이터 매핑**(`flow.need` / `flow.action` / `flow.capabilityLogic`)과 병렬 모드·워크스페이스 루트 규칙을 명시했다.
- Core 스레드 **인계용 미완 체크리스트**를 단계별로 2항목씩 보강했다(모두 `[ ]` 유지).
- `GET /api/ralph/layer-flow`에서 `readCapabilitySummary`가 잘못된 문자열(`% 3`)에 의존하던 문제를 제거하고, `ralph-common.sh`의 실제 3역할 분기·`RALPH_AUTO_EXPAND_ON_COMPLETE:-1` 존재 여부로 요약하도록 수정했다.
- `.ralph/progress.md` 또는 `RALPH_TASK.md`가 없을 때 API가 500으로 죽지 않도록 읽기 실패를 **문자열 폴백**으로 처리했다.

## 수정한 파일

- `apps/open-graze/content/ralph-layers/01_need.md`
- `apps/open-graze/content/ralph-layers/02_action.md`
- `apps/open-graze/content/ralph-layers/03_capability_business_logic.md`
- `apps/open-graze/app/api/ralph/layer-flow/route.ts`
- `.ralph/parallel/1778081492-4cd3d244/agent-thread1.md` (본 보고서)

## 테스트 실행

- 루트에서 전체 빌드(저장소 관행상 `test` ≈ 빌드):  
  `npm run build`
- (선택) 서버 기동 후 스모크:  
  `npm run runtime:smoke`  
  (서버가 떠 있어야 함.)

## 주의사항

- `.ralph/parallel/`는 `.gitignore`에 포함될 수 있다. 이 보고서를 커밋할 때는 `git add -f .ralph/parallel/1778081492-4cd3d244/agent-thread1.md`처럼 **강제 스테이징**이 필요할 수 있다.
- `RALPH_TASK.md`와 `.ralph/progress.md`는 과제 지시에 따라 **수정하지 않았다**.
- `.ralph/progress.md`는 병렬 모드에서 건드리지 말라는 지침이 있어, Action 폴백 문구에 **병렬 에이전트 보고 경로**를 안내했다.
- 별도 단위 테스트 러너는 워크스페이스에 없어, 검증은 `npm run build`로 수행했다.
