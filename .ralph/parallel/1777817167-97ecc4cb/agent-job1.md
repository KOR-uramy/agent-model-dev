# Agent job1 — `sessionId` 쿼리 동기화

## 변경 요약

- **`/` 홈**: 타임라인 `role`·`sessionId` 필터를 **URL 쿼리가 단일 소스**가 되도록 정리했습니다. `?sessionId=` 는 선택·직접 입력·적용 시 `router.replace`로 반영되며, 다른 키(`role` 등)는 `URLSearchParams` 복사로 유지됩니다. 값이 비면 `sessionId` 키를 삭제합니다. `sessionId=` 만 있고 값이 공백뿐이면 API(`GET /api/ralph/events`)와 같게 무의미한 필터로 보고 **키 제거**용 `useEffect`로 정규화합니다.
- **`parseSessionIdQueryParam`**: `ralph-workspace-sdk`에 추가해 API 라우트와 동일 의미로 쓰입니다.
- **클라 번들**: 홈이 SDK 메인 엔트리를 끌어와 `fs/promises` 번들 오류가 나지 않도록, 클라이언트용 파싱·`AGENT_ROLE_KEYS`·`eventDetailRole` 은 `apps/open-graze/lib/timeline-query-params.ts`에 두고 `import type`만 SDK에서 가져옵니다.
- **README**: `apps/open-graze/README.md`에 `?role=planning&sessionId=ralph-session-example` 한 줄 예시를 넣었습니다.

## 부수 수정 (빌드 통과)

워크트리에 이미 있던 타입/중복 코드 때문에 `npm run build`가 실패해, 동일 커밋에서만 다음을 고쳤습니다.

- `app/dashboard/[slug]/page.tsx`: 중복된 `copyNewTokenOnly` / `copyOpenGrazeEnvSnippet` 제거, `btnSecondary` import, `billingSuccess` = `useSearchParams().get("billing") === "success"`.
- `app/dashboard/page.tsx`, `app/login/page.tsx`, `app/register/page.tsx`: 누락된 `ui-tokens` import 보강.

## touched files

- `apps/open-graze/app/page.tsx`
- `apps/open-graze/lib/timeline-query-params.ts` (신규)
- `apps/open-graze/app/api/ralph/events/route.ts`
- `apps/open-graze/README.md`
- `packages/ralph-workspace-sdk/src/snapshot.ts`
- `packages/ralph-workspace-sdk/src/index.ts`
- `apps/open-graze/app/dashboard/[slug]/page.tsx`
- `apps/open-graze/app/dashboard/page.tsx`
- `apps/open-graze/app/login/page.tsx`
- `apps/open-graze/app/register/page.tsx`

## 테스트 실행

저장소 루트:

```bash
npm install
npm run build
```

앱 단위 테스트 스크립트는 없습니다. 수동 확인: `npm run dev` 후 `http://localhost:3000/?role=planning&sessionId=ralph-session-example` 로 열고, 세션/역할 UI 변경 시 URL·요청 쿼리가 함께 바뀌는지 확인합니다.

## 주의사항 (gotchas)

- Next가 **상위 디렉터리의 다른 `package-lock.json`** 을 워크스페이스 루트로 잡을 수 있다는 경고가 나올 수 있습니다. 로컬에서는 이 워크트리에서 `npm install` 후 빌드하는 것이 안전합니다.
- `useSearchParams` 를 쓰는 `/dashboard/[slug]` 는 동적 라우트로 빌드는 통과했으나, 배포 환경에서 CSR 힌트가 나오면 해당 레이아웃에 `Suspense`를 두는 검토가 필요할 수 있습니다.
