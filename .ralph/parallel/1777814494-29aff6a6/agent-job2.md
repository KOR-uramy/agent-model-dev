# Agent job2 — UI 핵심 화면·동종 SaaS 갭·재현 가능 개선

## 동종 SaaS 기준(비교 축)

참고로 **레이아웃·정보 밀도·내비 일관성**을 기준에 둔 대표 동종/인접 제품: **Vercel 대시보드**, **Linear 워크스페이스 설정**, **Notion 팀 스페이스 목록**, **Stripe Dashboard**(설정·키·로그 밀도). (URL·선정 이유의 장문 기록은 오케스트레이터가 `.ralph/progress.md`에 남기는 것이 본 레포 규약.)

## 갭 요약 (레이아웃 · 밀도 · 일관성)

| 화면 | 이전 갭 | 이번에 반영한 개선 |
|------|---------|---------------------|
| `/` | 히어로·표 영역이 `max-w-xl`로 좁아 타임라인 테이블(`min-w-[960px]`)과 시각 축이 어긋남 | 메인을 `max-w-5xl`로 헤더와 맞추고, 히어로만 `max-w-2xl`로 읽기 폭 유지 |
| `/login`, `/register` | `AuthCard`·`inputField` 미임포트로 런타임/빌드 불일치, `registered` 미정의 | import 정리, `?registered=1` 배너, 제목·본문·CTA를 `ui-tokens`와 통일 |
| `/dashboard` | 잘못된 `</div>`로 **빌드 실패**, 빈 목록 UX 없음 | JSX 수정, 빈 상태 카드, 카드·버튼·목록 행 토큰화 |
| `/dashboard/[slug]` | `publicOrigin`·클립보드 헬퍼·`copyHint` 누락으로 타입/런타임 위험 | `window.location.origin`, 복사 피드백, 수집 예시 URL, 섹션·버튼 토큰 정리 |

## 재현 가능한 개선 — 하위 체크리스트 (오케스트레이터가 `RALPH_TASK.md`에 옮길 수 있음)

- [ ] `/` 홈 헤더 내비를 `AppChrome`과 동일 패턴(활성 표시·구분선)으로 추출해 **한 컴포넌트**로 공유한다.
- [ ] 워크스페이스 상세 **작업·이벤트**를 JSON `pre` 대신 **테이블/가상 스크롤**로 바꿔 동종 대시보드 수준 밀도를 맞춘다.
- [ ] 로그인·가입에 **비밀번호 표시 토글**, **Caps Lock 힌트**, 포커스 링·에러를 `role="alert"`로 정리한다.
- [ ] `AppMain`에 **breadcrumb 슬롯**을 두고 워크스페이스 하위 경로(`/billing` 등)와 제목을 통일한다.
- [ ] 다크 모드에서 **테이블 헤더 대비**(WCAG)를 수치로 검증하고 토큰만 조정한다.

## 코드에서 바꾼 것

- `lib/ui-tokens.ts`: 페이지 제목·리드·카드 패널·1차/2차 버튼·목록 행 클래스를 한곳에 정의.
- `app/components/app-chrome.tsx`: 활성 탭 배경·세로 구분선·`aria-label`로 상단 바 일관성 강화.
- `app/page.tsx`: 랜딩 메인 폭 정렬.
- `app/login/page.tsx`, `app/register/page.tsx`: 토큰 기반 타이포/CTA, 로그인 가입 완료 플로(`registered=1`, 자동 로그인 실패 시 로그인으로 이동).
- `app/dashboard/page.tsx`: 빌드 깨짐 수정·빈 목록·토큰 사용.
- `app/dashboard/[slug]/page.tsx`: 복사·origin·수집 URL 예시·공통 토큰.

## 건드린 파일

- `apps/open-graze/lib/ui-tokens.ts`
- `apps/open-graze/app/components/app-chrome.tsx`
- `apps/open-graze/app/page.tsx`
- `apps/open-graze/app/login/page.tsx`
- `apps/open-graze/app/register/page.tsx`
- `apps/open-graze/app/dashboard/page.tsx`
- `apps/open-graze/app/dashboard/[slug]/page.tsx`
- `.ralph/parallel/1777814494-29aff6a6/agent-job2.md` (본 보고서)

## 테스트 실행

- 루트: `npm run build` (workspace `ralph-workspace-sdk` + `open-graze` Next 프로덕션 빌드)
- 별도 UI 단위 테스트 스위트는 없음(요청 시 `open-graze`에 Vitest/Playwright 추가는 `package.json` 변경이 필요해 이번 작업 범위에서 제외).

## Gotchas

- 병렬 모드에서 **`.ralph/progress.md`와 `RALPH_TASK.md`는 수정하지 않음**(지시 준수).
- `package.json` 등 머지 핫스팟은 건드리지 않음 — 새 테스트 러너는 추가하지 않았음.
- 가입 후 자동 로그인이 실패하면 이제 **`/login?registered=1`**으로내므로, 사용자는 배너만 보고 에러 문구는 보지 못함(의도된 단순화).
