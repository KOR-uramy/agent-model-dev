# Agent job2 보고 — API·UI `source` 필터

## 변경 요약

- `GET /api/ralph/events`, `GET /api/ralph/events/range`에 선택 쿼리 **`source`**(`ralph` \| `application`) 추가. 타임라인 `WorkspaceFeedEvent.source`와 동일 집합이며, 비어 있지 않은 잘못된 값은 **400**과 `RALPH_EVENTS_SOURCE_QUERY_ERROR` 메시지.
- SQLite `TimelineEvent` 조회 시 **`source` 컬럼**으로 필터(구간 API는 `Prisma.join`으로 `role`·`sessionId`·`source` 조합).
- 홈 **`/`** 에 출처 `<select>` 추가, **`?source=`** 와 양방향 동기화; 잘못된 값은 URL에서 제거.
- 출처만 골랐을 때 최근 구간에 해당 행이 없으면 안내 힌트(`SOURCE_FILTER_EMPTY_HINT`).
- **`apps/open-graze/README.md`**: `source` 필터 설명 및 필터 유·무 건수 비교용 **`printf` + `curl` 한 줄**(`events` 길이 / `returnedCount`).
- **`ralph-workspace-sdk`**: `EVENT_SOURCE_KEYS`, `parseSourceQueryParam` 추가(외부 SDK 소비자용).

## 수정한 파일

- `packages/ralph-workspace-sdk/src/types.ts`
- `packages/ralph-workspace-sdk/src/snapshot.ts`
- `packages/ralph-workspace-sdk/src/index.ts`
- `apps/open-graze/lib/timeline-feed.ts`
- `apps/open-graze/lib/timeline-query-params.ts`
- `apps/open-graze/app/api/ralph/events/route.ts`
- `apps/open-graze/app/api/ralph/events/range/route.ts`
- `apps/open-graze/app/page.tsx`
- `apps/open-graze/README.md`

## 테스트 실행

- OpenGraze 프로덕션 빌드: 저장소 루트에서 `npm run build -w open-graze`
- (선택) 루트 `npm run runtime:smoke` — 서버 기동 후 기존 스모크는 `source` 미검증

## 주의사항 (gotchas)

- **워크스페이스 빌드**: `ralph-workspace-sdk`는 `dist/`를 씁니다. SDK 소스만 고치고 `npm run build -w ralph-workspace-sdk`를 안 하면 다른 워크스페이스에서 구버전 `dist`를 물을 수 있음.
- **Next 워크스페이스 루트**: 이 환경에서는 상위 디렉터리 `node_modules`가 잡히는 경고가 있어, API 라우트의 `parseRoleQueryParam` / `parseSourceQueryParam`은 **`@/lib/timeline-query-params`**에서 import해 로컬 구현과 항상 일치하도록 함.
