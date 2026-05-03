# Agent job3 — 운영·감사 「현재 뷰 URL 복사」

## 변경 요약

- **`/` 홈 타임라인**: 「현재 뷰 URL 복사」 버튼으로 `window.location.origin` 기준 **절대 URL**을 클립보드에 넣으며, 적용 중인 **`role`·`sessionId`·`from`·`to`·`source`(설정 시)** 쿼리를 모두 포함한다(`lib/home-view-url.ts`).
- **필터 확장**: URL·`GET /api/ralph/events`·UI에 **`from`/`to`(ISO 8601 쌍)** 및 **`source`**(`ralph`|`application`)를 연결했다. 구간이 있으면 DB는 `loadTimelineEventsInRange`의 **최신 우선** 모드로 읽고, `source`는 병합 후 필터한다.
- **공통 파싱**: `parseTimelineRangeParams`·`parseSourceQueryParam`을 `lib/timeline-query-params.ts`로 옮겨 클라이언트·API가 공유한다. `timeline-feed`에 `source`/구간 인자를 받는 `loadTimelineFromDb` 시그니처 확장.
- **README**: 시크릿 창에서 URL 붙여넣기 후 주소창·필터 UI 일치로 검증하는 **한 줄** 절차를 `apps/open-graze/README.md`에 추가했다.
- **500줄 규칙**: 홈 UI를 `home-page-content.tsx` / `home-landing-column.tsx` / `home-timeline-section.tsx` / `home-feed-support.tsx`로 분리했다.

## 수정·추가된 파일

- `apps/open-graze/app/page.tsx` — 얇은 래퍼만 유지
- `apps/open-graze/app/components/home-page-content.tsx` — 상태·fetch·URL 동기화
- `apps/open-graze/app/components/home-landing-column.tsx` — 랜딩·요약·새로고침
- `apps/open-graze/app/components/home-timeline-section.tsx` — 타임라인 카드·푸터·복사·필터 폼
- `apps/open-graze/app/components/home-feed-support.tsx` — 라벨·표시 헬퍼·`PlatformRow`/`Stat`
- `apps/open-graze/lib/home-view-url.ts` — 절대 URL·쿼리 문자열 빌더
- `apps/open-graze/lib/timeline-query-params.ts` — 구간·`source` 파싱
- `apps/open-graze/lib/timeline-feed.ts` — `loadTimelineFromDb` 확장, `newestFirst`, 힌트
- `apps/open-graze/app/api/ralph/events/route.ts` — 쿼리 검증·위 로더 호출
- `apps/open-graze/app/api/ralph/events/range/route.ts` — `parseTimelineRangeParams` import 경로
- `apps/open-graze/README.md` — 감사 검증 한 줄

## 테스트 실행

```bash
npm run lint -w open-graze
npm run build -w open-graze
```

(별도 단위 테스트 러너는 워크스페이스에 없음.)

## 주의사항

- `from`/`to`는 **쌍**이어야 하며, 하나만 있거나 파싱 실패 시 클라이언트가 쿼리에서 둘 다 제거한다.
- 클립보드 API는 **보안 컨텍스트(HTTPS 또는 localhost)** 에서만 동작하는 경우가 많다.
- `.ralph/progress.md`는 수정하지 않았다(병렬 규칙).
