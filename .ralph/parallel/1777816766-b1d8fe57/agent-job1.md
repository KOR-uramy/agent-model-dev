# Agent job1 보고 — `/` 역할 필터와 `?role=` URL 동기화

## 변경 요약

- 홈(`/`) 타임라인 **역할 필터**를 브라우저 주소 **`?role=`** 와 **양방향**으로 맞췄다. `useSearchParams`로 URL을 읽고, 셀렉트 변경 시 `router.replace`로 같은 의미의 쿼리만 갱신한다(기존 다른 쿼리 키는 유지).
- 필터 값은 **`GET /api/ralph/events`**와 동일하게 `ralph-workspace-sdk`의 **`parseRoleQueryParam`**으로 파싱한다(허용: `planning` \| `design` \| `implementation` \| `test`).
- `role` 키는 있는데 값이 비어 있거나 규약 밖이면, 혼동을 줄이기 위해 **주소에서 `role` 파라미터를 제거**하는 `useEffect`를 두었다.
- `useSearchParams` 요구에 맞춰 페이지를 **`Suspense`**로 감싸 폴백을 제공했다.
- `apps/open-graze/README.md`에 **복사 가능한 예시 URL 한 줄**(코드 펜스, `planning` 고정)을 추가했다.
- `app/api/ralph/events/route.ts`에서 사용되지 않던 **`AgentRoleKey` 미참조 블록**(중복 파서)을 제거해 타입·유지보수 혼선을 줄였다.

## 수정한 파일

- `apps/open-graze/app/page.tsx` — URL ↔ 역할 필터 동기화, `Suspense`, `parseRoleQueryParam`
- `apps/open-graze/app/api/ralph/events/route.ts` — 미사용 상수·함수 제거
- `apps/open-graze/README.md` — `?role=` 동기화 설명 + 예시 URL
- `.ralph/parallel/1777816766-b1d8fe57/agent-job1.md` — 본 보고서

## 테스트 실행

- 단위 테스트 스크립트는 저장소에 없음. 변경 파일에 대해:
  - `cd apps/open-graze && npx eslint app/page.tsx app/api/ralph/events/route.ts`
- 수동 확인 권장: `npm run dev` 후 `http://localhost:3000/?role=planning`으로 열어 필터·데이터가 기획만으로 보이는지, 셀렉트를 바꿀 때 주소가 같이 바뀌는지, 뒤로 가기로 URL이 바뀌면 필터가 따라가는지 확인.

## 주의사항

- `.ralph/`는 `.gitignore`에 있으므로 보고서는 **`git add -f .ralph/parallel/1777816766-b1d8fe57/agent-job1.md`**로 스테이징해야 할 수 있다.
- 워크트리 전체 `tsc`는 **다른 경로의 기존 오류**로 실패할 수 있다. 본 변경 파일은 위 `eslint`로 검증했다.
- 루트 `README.md`가 아닌 **`apps/open-graze/README.md`**만 수정했다(작업 범위·충돌 방지 지침과 일치).
