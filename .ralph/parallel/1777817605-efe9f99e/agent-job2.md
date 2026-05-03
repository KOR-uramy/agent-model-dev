# Agent job2 보고 — `events/range` 상한·잘림 신호

## 변경 요약

- **고정 규칙**: 행 상한(SQLite `LIMIT`)에 닿아도 **HTTP 200**을 유지하고, JSON 최상위 **`truncated`**(boolean), **`returnedCount`**(number, 항상 `events.length`)로 기계 판독 가능하게 표시합니다. **413 등 거절 응답은 사용하지 않습니다.**
- `loadTimelineEventsInRange`가 라우트에서 넘기던 네 번째 인자 `{ role, sessionId }`를 받도록 **`TimelineRangeLoadOpts`** 타입과 기본값을 추가해 빌드 오류를 제거했습니다.
- `scripts/runtime-smoke.mjs`가 range 응답을 **배열이 아닌 객체**로 검증하고(`events`, `truncated`, `returnedCount`), 더 이상 쓰이지 않던 `getArray` 헬퍼를 제거했습니다.
- `apps/open-graze/README.md`에 잘림 확인 **한 줄** 절차를 `truncated`·`returnedCount`·`events.length`까지 출력하도록 정리했고, 예전 루트 배열 가정(`.length`)이 있던 `curl` 예를 `returnedCount` 기준으로 맞췄습니다.

## 수정·추가한 파일

- `apps/open-graze/lib/timeline-feed.ts`
- `apps/open-graze/app/api/ralph/events/range/route.ts`
- `apps/open-graze/README.md`
- `scripts/runtime-smoke.mjs`
- `.ralph/parallel/1777817605-efe9f99e/agent-job2.md` (본 파일)

## 테스트 실행

- `npm run build -w open-graze` — 타입 검사·프로덕션 빌드
- 서버 기동 후: `npm run runtime:smoke -w open-graze` (또는 루트에서 `RUNTIME_SMOKE_BASE_URL=... npm run runtime:smoke`가 있다면 동일 스크립트)

## 주의사항

- `.ralph/`는 `.gitignore`에 있어 보고서를 커밋할 때는 `git add -f .ralph/parallel/.../agent-job2.md`가 필요할 수 있습니다.
- `RALPH_TASK.md`, 루트 `README.md`, `.ralph/progress.md`는 수정하지 않았습니다.
- 잘림은 **DB에서 가져온 행 수**가 `limit`에 도달했을 때 `true`이며, 페이로드 파싱 실패로 `events`가 줄어들어도 동일 기준입니다.
