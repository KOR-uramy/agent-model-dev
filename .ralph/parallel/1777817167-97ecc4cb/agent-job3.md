# Agent job3 보고 — range 상한·잘림 신호

## 변경 요약

- **규칙(고정)**: HTTP 413 거절이 아니라 **200 + JSON 최상위 메타** — `truncated`(boolean), `returnedCount`(숫자), 본문 이벤트는 `events` 배열.
- **`truncated: true` 조건**: SQLite 쿼리가 적용한 `LIMIT`만큼 행을 채워 돌려줄 때(구간 안에 더 있을 수 있음). 페이로드 파싱 실패로 `events` 길이가 줄어도 DB 행 수 기준은 동일.

## 수정 파일

- `apps/open-graze/lib/timeline-feed.ts` — `loadTimelineEventsInRange`가 `{ events, truncated }` 반환, `TimelineRangeLoadResult` 타입 추가.
- `apps/open-graze/app/api/ralph/events/range/route.ts` — 위 결과를 `{ events, truncated, returnedCount }`로 직렬화.
- `apps/open-graze/README.md` — 응답 형태 설명 갱신, 잘림 확인용 `curl | node -p` 한 줄.

## 테스트 실행

- 저장소에 단위 테스트 러너(vitest 등)가 없음. **수동**: README의 잘림 확인 줄(개발 서버 + DB에 타임라인 ≥1건 가정).
- `npm run build -w open-graze`는 워크스페이스의 기존 이슈(`fs/promises` 번들 등)로 실패할 수 있음 — 본 변경과 무관한 상태였음.

## 주의(Gotchas)

- **호환성**: 이전의 “순수 JSON 배열” 응답에서 **`{ events, … }` 객체**로 바뀜. 저장·파이프라인은 `.events`를 사용해야 함.
- 잘림 확인 절차는 **해당 날짜 구간에 이벤트가 최소 1건** 있어야 `limit=1`에서 `truncated === true`가 나옴(비어 있으면 `false`).
