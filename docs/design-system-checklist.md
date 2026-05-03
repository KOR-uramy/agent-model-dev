# OpenGraze 디자인 시스템 점검 체크리스트

타이포·색·간격·컴포넌트 중복을 줄이고, `globals.css` + `lib/ui-tokens.ts`와 한 방향으로 맞추기 위한 후속 작업입니다.

## 브랜드·토큰

- [ ] 홈(`app/page.tsx`) 히어로·CTA에 남아 있는 `neutral-*` 하드코드를 시맨틱 토큰(`foreground` / `muted` / `list-border` 등)으로 단계적 치환한다.
- [ ] 역할 배지(`roleBadgeClass`)용 팔레트를 CSS 변수(`--role-planning-bg` 등)로 옮겨 다크 모드와 문서 한곳에서 관리한다.
- [ ] `text-red-600` 등 오류·경고 색을 `--danger` 계열과 Tailwind 유틸로 매핑해 일관된 피드백 색을 쓴다.

## 타이포·시각 계층

- [ ] 페이지 제목은 `font-display` + `tracking-tight` 규칙을 랜딩·대시보드 하위 화면까지 통일한다.
- [ ] 타임라인 테이블 헤더(`text-[11px]` uppercase)와 카드 eyebrow(`sectionEyebrow`)의 단계를 문서화해 혼용을 줄인다.

## 간격·레이아웃

- [ ] `AppMain`과 동일한 가로 패딩을 쓰지 않는 단독 레이아웃(예: 랜딩 `max-w-xl`)이 의도인지 검토하고, 필요 시 `max-w-page-narrow` 같은 토큰으로만 차이를 낸다.

## 컴포넌트 중복

- [ ] 보조 버튼·고스트 링크를 `ui-tokens`의 `linkSubtle` 변형으로 묶어 결제·빌링 화면까지 재사용한다.
- [ ] `AppChrome`과 유사한 랜딩 전용 헤더를 공통 크롬으로 합칠지(내비 항목 차이) 제품 결정을 내린다.
