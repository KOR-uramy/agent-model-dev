# Agent job3 — 재현·감사 기간보내기

## 변경 요약

- SQLite `TimelineEvent`만 조회하는 **`GET /api/ralph/events/range`**를 추가했습니다. 쿼리 **`from`·`to`(ISO 8601, 필수)**와 선택 **`limit`(기본·상한 10000)**으로 기간을 지정하면 응답 본문이 **`WorkspaceFeedEvent`의 JSON 배열**만 내려갑니다(대시보드용 `GET /api/ralph/events`의 `events` 항목과 동일 형태).
- 시각 필터는 문자열 비교 대신 SQLite **`strftime('%s', ts)`**로 초 단위 비교해, `…Z`와 `….000Z`처럼 표기만 다른 타임스탬프가 섞여도 범위가 어긋나지 않도록 했습니다.
- `apps/open-graze/README.md`에 **포함 필드 표**(시각 `ts`, 유형 `kind`, `detail.role`, `sessionId` 등)와 파일 저장용 **`curl` 예시**를 넣었습니다.

## 수정·추가 파일

- `apps/open-graze/lib/timeline-feed.ts` — `parseTimelineRangeParams`, `loadTimelineEventsInRange`, `TIMELINE_RANGE_MAX_ROWS` 등
- `apps/open-graze/app/api/ralph/events/range/route.ts` — 신규 라우트
- `apps/open-graze/README.md` — 기간보내기 절·필드 표
- 본 보고서: `.ralph/parallel/1777815957-e93eec8b/agent-job3.md` (`.ralph/`는 gitignore이므로 커밋 시 `git add -f` 필요)

## 테스트 실행

- 이 워크스페이스에서는 루트 `npm run build`가 **기존** `page.tsx` / `ui-tokens.ts`의 중복 선언 오류로 실패했습니다(본 작업 diff와 무관). 변경분만 검증하려면:

```bash
cd apps/open-graze && npx eslint lib/timeline-feed.ts app/api/ralph/events/range/route.ts
```

- 런타임 스모크(서버 기동 후, DB에 타임라인이 동기화된 상태):

```bash
curl -sS "http://localhost:3000/api/ralph/events/range?from=2026-05-01T00:00:00Z&to=2026-05-03T23:59:59Z" | head -c 200
```

- `from`/`to` 누락·역순·비파싱 문자열이면 **400**과 `{ "error": "…" }` JSON 객체를 반환합니다(성공 시에만 순수 배열).

## 주의사항

- `OPENGRAZE_WORKSPACE_KEY`(미설정 시 `default`)와 동일한 `workspaceKey` 행만 반환합니다. `loadTimelineFromDb`와 동일 규칙입니다.
- `limit` 상한은 DoS 완화를 위해 **10000**입니다.
- DB `ts`가 SQLite가 해석하지 못하는 문자열이면 해당 행은 `strftime` 비교에서 제외될 수 있습니다.
