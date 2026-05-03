# Agent job4 — 디자인 / 디자인 토큰

## 변경 요약

- **`globals.css`**: 반지름(`--radius-*`), 카드 그림자(`--shadow-card`), 헤더 높이(`--header-height`) 등 브랜드·레이아웃 토큰을 `:root`에 정리해 타이포·색과 분리된 **공간·형태** 단일 근원으로 둠.
- **`lib/ui-tokens.ts`**: 폼 라벨·카드 표면·CTA 버튼·에러 문구·테이블 헤더·`details` 요약·역할 배지(`roleBadgeClass`)를 한곳으로 모아 **중복 클래스 문자열**을 줄임.
- **`app-chrome.tsx`**: `AuthCard`와 헤더가 위 CSS 토큰을 사용하도록 맞춤; 홈과 동일한 **AppChrome** 리듬 유지.
- **`app/page.tsx`**: 커스텀 헤더를 제거하고 **`AppChrome active="home"`**으로 통합해 내비·타이포 계층을 다른 화면과 일치.
- **대시보드·로그인·가입**: `surfaceCard`, `formLabel`, `btnPrimary` 등 토큰 적용.
- **빌드 복구(병행)**: `dashboard/page.tsx` 잘못된 `</div>` 제거, `login/page.tsx` 누락 import·`registered` 쿼리, `[slug]/page.tsx` 누락된 클립보드/`publicOrigin` 상태 및 핸들러 보완.

## 수정한 파일

- `apps/open-graze/app/globals.css`
- `apps/open-graze/lib/ui-tokens.ts`
- `apps/open-graze/app/components/app-chrome.tsx`
- `apps/open-graze/app/page.tsx`
- `apps/open-graze/app/login/page.tsx`
- `apps/open-graze/app/register/page.tsx`
- `apps/open-graze/app/dashboard/page.tsx`
- `apps/open-graze/app/dashboard/[slug]/page.tsx`
- 본 파일: `.ralph/parallel/1777814494-29aff6a6/agent-job4.md`

## 테스트 실행

- 루트: `npm run build` (workspace SDK + `open-graze` Next 빌드)
- 앱만: `npm run build -w open-graze`
- 선택: `npm run lint -w open-graze`

별도 UI 단위 테스트는 추가하지 않음(토큰은 빌드·린트로 검증).

## 주의사항

- **`.ralph/`는 `.gitignore`됨** — 이 보고서를 커밋에 넣으려면 `git add -f .ralph/parallel/1777814494-29aff6a6/agent-job4.md` 필요.
- 병렬 작업 지시에 따라 **`RALPH_TASK.md`·`.ralph/progress.md`는 수정하지 않음.** 아래 `- [ ]`는 오케스트레이터가 `RALPH_TASK.md` **「성장·동종 비교」> 디자인** 절에 붙일 수 있는 **후보 하위 항목**이다.

## RALPH_TASK 병합용 디자인 후보 (`- [ ]`)

성장·동종 비교의 **디자인** 줄 아래에 붙이기 좋은 측정 가능한 하위 작업:

- [ ] 결제·빌링(`billing` 클라이언트) 화면의 버튼·경고 박스를 `ui-tokens`의 `btnPrimary` / 에러·성공 톤과 맞춰 **토스/브랜드 톤 일관화**한다.
- [ ] `SHOW_LOGIN_LINKS === false`일 때 **AppChrome에서 로그인·가입 링크를 숨기는** 옵션을 두고, 홈(`page.tsx`)과 동작을 다시 맞춘다.
- [ ] 가입 완료 후 로그인 안내 배너를 쓰려면 `register` → `login?registered=1` 리다이렉트와 **카피·접근성(포커스)** 를 한 시나리오로 묶는다.
- [ ] `globals.css`의 `--radius-*`를 **Tailwind `@theme`에 안전하게 노출**(자기 참조 없이)해 `rounded-*` 유틸과 1:1로 쓰도록 정리한다.
- [ ] 홈 히어로의 **2차·3차 문단 타이포 스케일**(현재 `text-sm` / `text-base` 혼재)을 `ui-tokens`의 단계형 프로즈 토큰으로 고정한다.
