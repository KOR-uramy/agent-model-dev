# Agent thread1 (Core 1~3) — 1778081847-e4f27ba7

## 변경 요약

- 레이어 md(`01`~`03`): `RALPH_TASK.md`·트리거 규칙·병렬 모드·`layer-flow` API와 맞추고, **다음 핸드오프용 미완 `[ ]`**를 보강했다.
- `layer-flow` API: `flow.capabilityLogic` 요약이 `ralph-common.sh`의 실제 패턴(3역할 순환·자동 확장)을 반영하도록 정리했고, 읽기 실패 시 안전한 폴백을 둔다.
- `flow.action`: `.ralph/progress.md`가 없거나 읽기 실패할 때(병렬 워크트리 등) `02_action.md`와 동일한 운영 가이드를 한 줄로 돌려준다.

## 수정한 파일

- `apps/open-graze/content/ralph-layers/01_need.md`
- `apps/open-graze/content/ralph-layers/02_action.md`
- `apps/open-graze/content/ralph-layers/03_capability_business_logic.md`
- `apps/open-graze/app/api/ralph/layer-flow/route.ts`
- `.ralph/parallel/1778081847-e4f27ba7/agent-thread1.md` (본 보고)

## 테스트 실행

- 저장소 루트: `npm run build`
- (선택) 앱 기동 후 API: `curl -sS http://localhost:3000/api/ralph/layer-flow | head -c 2000`

오픈그라이즈 단독 워크스페이스에서 빌드할 때는 `apps/open-graze`에서 `npm run build`도 가능하다.

## 주의사항

- **의도적으로** `RALPH_TASK.md`와 `.ralph/progress.md`는 수정하지 않았다(오케스트레이터/병렬 정책).
- 새 체크리스트 항목으로 Core 스레드 `pendingChecklist` 숫자가 늘어난다. 시각화의 트리거 카운트가 변하는 것은 정상이다.
