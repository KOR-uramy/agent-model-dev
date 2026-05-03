# Agent job1 보고 — API 역할 필터 (`GET /api/ralph/events`)

## 변경 요약

- `GET /api/ralph/events`에 쿼리 파라미터 **`role`**을 추가했습니다. 값은 `planning` \| `design` \| `implementation` \| `test` 중 하나이며, SQLite에서 `payload` JSON의 **`$.detail.role`**과 일치하는 `TimelineEvent`만 최근 `tail`건까지 조회합니다.
- 잘못된 `role` 값이면 **400**과 `INVALID_ROLE` JSON을 반환합니다.
- 역할 필터로 결과가 0건이어도, 타임라인 자체가 비어 있는 경우와 구분하기 위해 **`TIMELINE_EMPTY`** 오류/힌트는 내지 않습니다(무필터일 때만 기존 동작).
- `apps/open-graze/README.md` 타임라인 절에 필터 설명과 **건수 비교용 한 줄** 명령을 넣었습니다.

## 수정한 파일

- `apps/open-graze/app/api/ralph/events/route.ts` — `role` 파싱·검증, `loadTimelineFromDb`에 옵션 전달
- `apps/open-graze/lib/timeline-feed.ts` — 필터 시 `json_extract` 기반 `$queryRaw`, 빈 결과 처리
- `apps/open-graze/README.md` — 검증용 `printf` + `curl` + `node -p` 한 줄
- `.ralph/parallel/1777815957-e93eec8b/agent-job1.md` — 본 보고서

## 테스트 실행

- 이 저장소에는 별도 단위 테스트 스크립트가 없습니다. 변경 파일에 대해 `npm run lint` 대신 다음으로 정적 검증했습니다.
  - `cd apps/open-graze && npx eslint app/api/ralph/events/route.ts lib/timeline-feed.ts`
- 수동 검증: `npm run dev` 후 README의 한 줄 명령으로 `all=` vs `role=planning=` 건수 비교, 그리고 `curl -sS -o /dev/null -w '%{http_code}\n' 'http://localhost:3000/api/ralph/events?role=invalid'` → **400**.

## 주의사항

- `.ralph/`는 기본 `.gitignore`에 포함되어 있어, 보고서 파일은 커밋 시 **`git add -f .ralph/parallel/1777815957-e93eec8b/agent-job1.md`**가 필요했습니다.
- `npm run build -w open-graze`는 이 워크트리에서 **다른 파일**(`app/dashboard/[slug]/page.tsx`, `lib/ui-tokens.ts` 등)의 기존 번들 오류로 실패할 수 있습니다. 본 작업과는 무관합니다.
- `role` 필터는 **동기화된 SQLite `TimelineEvent.payload`**에만 적용됩니다. JSONL에만 있고 아직 동기화되지 않은 행은 API에 나오지 않습니다(기존과 동일).
- `package.json` 등 충돌 다발 파일은 요구사항에 따라 수정하지 않았습니다.
