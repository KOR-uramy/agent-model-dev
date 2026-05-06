# Agent thread1 (Core 1~3) — 병렬 작업 보고

## 변경 요약

- **레이어 md (01~03)**: `RALPH_TASK.md`와 병렬 스레드·트리거 규칙에 맞춰 본문을 보강하고, 다음 핸드오프 품질용 **미완 체크리스트 `[ ]`**를 유지·추가했다.
- **`flow.capabilityLogic` 정합**: 더 이상 `ralph-common.sh` 문자열 휴리스틱에 의존하지 않고, **`03_capability_business_logic.md` 본문(체크 섹션 이전) + 미완 체크**에서 요약한다.
- **`flow.action` 정합**: `.ralph/progress.md` tail에 더해 **`02_action.md`의 미완 체크**를 같은 문자열에 합쳐 병렬 모드(progress 미갱신)에서도 Action 근거가 남도록 했다.
- **공통 파서**: 체크리스트 파싱·요약 로직을 `lib/ralph-layer-markdown.ts`로 분리해 Core 레이어 문서와 API가 같은 규칙을 쓰게 했다.

## 수정·추가 파일

- `apps/open-graze/content/ralph-layers/01_need.md`
- `apps/open-graze/content/ralph-layers/02_action.md`
- `apps/open-graze/content/ralph-layers/03_capability_business_logic.md`
- `apps/open-graze/lib/ralph-layer-markdown.ts` (신규)
- `apps/open-graze/app/api/ralph/layer-flow/route.ts`
- `.ralph/parallel/1778082002-40ab5303/agent-thread1.md` (본 보고서)

## 테스트 실행

- 루트에서 전체 타입·빌드 검증: `npm run build`
- (선택) 서버 기동 후 API 확인: `curl -sS http://localhost:3000/api/ralph/layer-flow | head -c 2000`
- 별도 단위 테스트 러너는 저장소에 없어, 이번 변경은 빌드로 검증했다.

## 주의사항 (gotchas)

- **`.ralph/progress.md`**: 병렬 에이전트 지침에 따라 수정하지 않았다. `flow.action`은 progress tail + 02 md 미완 체크이므로, progress가 비어 있으면 02 체크만으로도 트리거 맥락이 드러난다.
- **`RALPH_TASK.md`**: 오케스트레이터 전용으로 요청대로 변경하지 않았다.
- **`.ralph/progress.md`**: 병렬 과제 지시에 따라 건드리지 않음(머지 충돌 방지).
