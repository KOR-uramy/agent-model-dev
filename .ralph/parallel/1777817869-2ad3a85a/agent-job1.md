# Agent job1 — URL `from`·`to` 쿼리 동기화

## 변경 요약

- 홈(`/`)에서 **`?from=`·`?to=`**(ISO 8601, UTC `Z` 정규화)이 주소와 UI(기간 입력·프리셋·적용·최근만 보기) 간 **양방향**으로 맞도록 했다.
- **`from`+`to`가 모두 유효할 때만** `GET /api/ralph/events/range`를 호출하고, `role`·`sessionId`는 쿼리에 그대로 붙여 API와 **동일한 AND 조합**으로 맞췄다.
- **`from`/`to`가 없거나 한쪽만 있거나 파싱 실패**하면 자동으로 해당 키를 제거하고(기존 `role`/`sessionId` 정리와 동일 패턴), **내부 `tail=1200` 고정**으로 `GET /api/ralph/events`만 쓴다(주소에 `tail`을 넣지 않음).
- 기간 모드에서는 메타(워크스페이스·경로·USD 환산율)만 `GET /api/ralph/events?tail=1`로 받고, 이벤트 배열은 range 응답으로 채운 뒤 `buildApiPayloadFromMetaAndRangeEvents`로 요약 지표를 맞췄다.
- `parseTimelineRangeParams`를 **`lib/timeline-query-params.ts`**로 옮겨 클라이언트·서버가 같은 규칙을 쓰게 했다.
- **`TIMELINE_RANGE_MAX_ROWS`**는 클라이언트가 `timeline-feed`(Prisma)를 끌어오지 않도록 **`lib/timeline-constants.ts`**로 분리했다.
- **`apps/open-graze/README.md`**: `role`·`sessionId`·`from`·`to`를 모두 넣은 **복붙 가능한 예시 URL 한 줄**을 반영했다.

## 수정·추가 파일

- `apps/open-graze/app/page.tsx`
- `apps/open-graze/lib/timeline-query-params.ts`
- `apps/open-graze/lib/timeline-feed.ts`
- `apps/open-graze/lib/timeline-constants.ts` (신규)
- `apps/open-graze/lib/timeline-client-payload.ts` (신규)
- `apps/open-graze/app/api/ralph/events/range/route.ts`
- `apps/open-graze/README.md`
- `.ralph/parallel/1777817869-2ad3a85a/agent-job1.md` (본 문서)

## 테스트 실행

- 타입·린트·프로덕션 빌드: 저장소 루트에서  
  `npm run build -w open-graze`
- (선택) 별도 단위 테스트 스크립트는 추가하지 않았다. `parseTimelineRangeParams`는 서버 range 라우트와 홈이 동일 모듈을 공유한다.

## 주의사항

- **`from`/`to`는 둘 다 있어야** 기간 모드로 인정한다. 한쪽만 있으면 URL에서 둘 다 제거된다.
- **구간 적용**은 입력이 API와 같이 파싱될 때만 주소를 갱신한다; 잘못된 입력은 무시된다(에러 토스트 없음).
- 기간 모드에서 **10,000건 잘림** 시 `truncated`에 따른 안내 문구가 `hint`로 붙는다.
