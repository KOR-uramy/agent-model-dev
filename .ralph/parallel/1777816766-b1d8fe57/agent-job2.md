# Agent job2 — API·UI 세션 스코프

## 변경 요약

- **`GET /api/ralph/events`**  
  - 쿼리 **`sessionId=<string>`** (공백 트림, 빈 값은 필터 없음) 시 SQLite `TimelineEvent.payload`의 **`$.sessionId`**가 일치하는 행만 조회합니다.  
  - `role`과 함께 쓰이면 DB에서 세션으로 좁힌 뒤 메모리에서 역할 필터를 적용합니다.  
  - `tail` 상한·최근 `tail`건 보존 로직은 기존 `role` 확장 패턴과 동일하게 `fetchSize`를 키웁니다.  
  - 세션으로 조회했는데 0건이면 **`TIMELINE_EMPTY`를 쓰지 않고** 힌트만 내려 전체 DB가 비었다는 오해를 줄입니다.

- **`/` (page.tsx)**  
  - `sessionId`를 API와 동일하게 쿼리에 붙여 한 세션만 시간순으로 표시합니다.  
  - **전체 세션** 조회일 때 응답 이벤트에서 `sessionId`를 모아 **드롭다운**을 채우고, **직접 입력 + 적용**으로 목록에 없는 ID도 지정할 수 있습니다.

- **기타**  
  - `timeline-feed.ts`에 누락돼 있던 **`ROLE_FILTER_EMPTY_HINT`** 상수를 추가했습니다(역할 필터 0건 힌트).  
  - `lib/ui-tokens.ts`의 **`btnPrimary` 중복 export** 제거(문법 오류).  
  - `app/dashboard/[slug]/page.tsx`의 **중복 `useState`(copyHint, publicOrigin)** 한 줄씩 제거.

## 수정한 파일

- `apps/open-graze/lib/timeline-feed.ts`
- `apps/open-graze/app/api/ralph/events/route.ts`
- `apps/open-graze/app/page.tsx`
- `apps/open-graze/lib/ui-tokens.ts`
- `apps/open-graze/app/dashboard/[slug]/page.tsx`

## 테스트 실행

- 이 워크스페이스에는 `open-graze`용 단위 테스트 스크립트가 없습니다.  
- 로컬에서 개발 서버가 떠 있을 때 예시:  
  `curl -sS 'http://localhost:3000/api/ralph/events?tail=100&sessionId=<실제세션ID>'`  
- `npm run build -w open-graze`는 모노레포 루트 lockfile/SDK 번들 이슈로 이 환경에서는 실패할 수 있습니다. 변경 파일에 대해 `read_lints` 기준 오류는 없었습니다.

## 주의사항 (gotchas)

- 세션 목록은 **“전체 세션”으로 받은 최근 `tail` 응답**에서만 갱신되므로, 오래된 세션 ID는 드롭다운에 없을 수 있고 **직접 입력**으로 조회하면 됩니다.  
- 필터는 JSON **`sessionId` 최상위 필드**와만 비교합니다(`json_extract`).  
- SQLite **`json_extract`**를 사용합니다(Prisma 기본 SQLite와 호환 가정).
