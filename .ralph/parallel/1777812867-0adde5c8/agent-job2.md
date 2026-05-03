# Agent job2 — UI 동종 SaaS 정렬·재현 가능한 개선 목록

## 무엇을 바꿨는지

- **공통 앱 크롬** (`AppChrome`): Linear·Vercel류 SaaS처럼 상단 고정 바(로고, 관측·대시보드·로그인·가입), `globals.css`의 시맨틱 토큰(`background`, `list-border`, `cta` 등)과 맞췄다.
- **인증 화면**: `/login`, `/register`를 동일한 **카드형 레이아웃**(`AuthCard`)·입력/버튼 스타일로 통일하고, 로그인↔가입 상호 링크를 넣었다.
- **`/` 헤더**: 크롬과 같은 **높이(h-14)·최대 폭(max-w-5xl)**·가입 링크로 정렬했다.
- **`/dashboard`, `/dashboard/[slug]`**: 크롬 + `AppMain`으로 세로 리듬·카드·테이블 헤더를 홈과 같은 토큰 기반으로 맞췄다(워크스페이스 상세는 `wide` 폭).
- **`/register` + `POST /api/auth/register`**: 문서에 있으나 워크트리에 없던 공개 가입 경로를 구현했다(zod 검증, bcrypt, 중복 이메일 409). 가입 후 Credentials로 자동 로그인 시도.
- **빌드 복구**: 대시보드가 참조하던 `@/lib/workspace-task-status`가 없어 `next build`가 깨져 있었음 → 요구사항 문서의 작업 상태 enum에 맞는 **라벨·가드 모듈**을 추가했다.

## 수정·추가한 파일

- `apps/open-graze/app/components/app-chrome.tsx` (신규)
- `apps/open-graze/app/api/auth/register/route.ts` (신규)
- `apps/open-graze/app/register/page.tsx` (신규)
- `apps/open-graze/lib/workspace-task-status.ts` (신규)
- `apps/open-graze/app/login/page.tsx`
- `apps/open-graze/app/page.tsx`
- `apps/open-graze/app/dashboard/page.tsx`
- `apps/open-graze/app/dashboard/[slug]/page.tsx`

## 테스트 실행 방법

- 루트에서 전체 빌드: `npm run build`
- 린트만: `npm run lint -w open-graze`
- 별도 Vitest/Jest 스크립트는 `open-graze` 패키지에 없어 단위 테스트 파일은 추가하지 않았다.

## Gotchas

- 병렬 작업 지시에 따라 **`RALPH_TASK.md`, `.ralph/progress.md`, README·lockfile 등**은 수정하지 않았다.
- 이 워크트리의 Prisma 스키마에는 **WorkspaceTask 모델이 없고** 빌드 출력에도 `/api/workspaces/[slug]/tasks` 라우트가 없다. UI는 유지되나 작업 표는 API가 생기기 전까지 빈 목록·오류일 수 있다(본 job 범위 밖).
- `AUTH_SECRET` 미설정 시 빌드 로그에 경고가 반복된다(기존 동작).

---

## 동종 SaaS 대비 남은 갭 — 재현 가능한 개선 (`- [ ]`)

비교 축: **Linear / Vercel Dashboard / Clerk** (상단 크롬 + 좌측 컨텍스트 내비 + 콘텐츠 카드 + 양호한 폼 접근성).

- [ ] **좌측 1차 내비**: 워크스페이스 목록·현재 slug·빌링을 한 컬럼에 고정하고, 본문만 스크롤되게 `layout.tsx` 분할(대시보드 전용 `(app)` 레이아웃).
- [ ] **브레드크럼**: `대시보드 > {slug} > 결제` 형태로 위치 인지(모바일에서는 축약).
- [ ] **로딩 스켈레톤**: `/dashboard` 목록·`[slug]`의 표·이벤트 JSON 영역에 `loading.tsx` 또는 SWR 스켈레톤.
- [ ] **빈 상태 일러스트/일관 카피**: 작업 0건·이벤트 `[]`일 때 단일 컴포넌트(`EmptyState`)로 아이콘·한 줄 설명·다음 액션(문서 링크·curl 복사) 통일.
- [ ] **표 밀도 토글**: 타임라인(`/`)·작업 표에 “촘촘함 / 보통” 행 높이 스위치(로컬 스토리지 기억).
- [ ] **키 복사 UX**: 새 API 키 노출 시 `navigator.clipboard` + 토스트(또는 `복사됨` 2초 피드백), 마스킹 미리보기.
- [ ] **반응형 표**: `max-w` 안에서 가로 스크롤 대신 주요 열만 고정·나머지 `details`로 접는 패턴 검토.
- [ ] **접근성 패스**: 로그인/가입 필드에 `aria-describedby`로 힌트 연결, 주 버튼에 `aria-busy`, 색 대비 WCAG AA 스팟 체크.
- [ ] **대시보드 크롬의 “로그인된 사용자” 분기**: 세션 있을 때 상단에 `가입` 대신 `계정` 메뉴(드롭다운) — `auth()`를 쓰는 서버 래퍼 또는 클라이언트 `useSession` 필요.
- [ ] **`/dashboard/[slug]/billing` 시각 정렬**: 결제 플로 화면을 동일 `AppChrome`·토큰으로 리스킨(현재 zinc 잔존 가능성 점검).
