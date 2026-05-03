# Agent job7 — 마케팅(가치 제안·신뢰·전환)

## 변경 요약

- **랜딩(`app/page.tsx`)**: 헤더 `Link`/`span` 오타 수정, 중복 로그인 링크 제거, 경쟁 대비 가치 제안 문단(APM/챗 분리 대비·`/llms.txt` 계약), 신뢰용 칩(자동 갱신·역할·공개 스키마), **CTA**를 「무료로 시작하기(가입) → 대시보드 → 이미 계정」 순으로 재배치. `SHOW_LOGIN_LINKS`가 꺼지면 가입 CTA 대신 단일 대시보드 CTA만 노출.
- **메타데이터(`app/layout.tsx`)**: 검색·첫 노출용 설명에 워크스페이스·수집 API·`/llms.txt`를 명시.
- **크롬(`app/components/app-chrome.tsx`)**: 전역 내비에 **연동 요약**(`/llms.txt`) 링크 추가.
- **대시보드 목록(`app/dashboard/page.tsx`)**: 잘못 열린 래퍼(`div` vs `AppChrome`)를 바로잡아 레이아웃 일관화, 카피에 공개 계약·가이드 경로 강조, 생성 버튼 문구를 전환 중심으로 조정.
- **로그인(`app/login/page.tsx`)**: `AppChrome`+`AuthCard`로 가입 화면과 동일한 신뢰 프레임, 문서 링크·가입 유도 CTA, `registered=1` 시 안내 배너, 버튼 라벨을 「대시보드로 로그인」으로 명확화.
- **가입(`app/register/page.tsx`)**: 가입 직후 가치(API 키)·`/llms.txt` 계약 문구 보강.

병합 충돌 방지 지침에 따라 **루트 `README.md`는 수정하지 않았습니다.** 아래 체크리스트에 README 보강 항목을 `- [ ]`로 남겼습니다.

## 수정한 파일

- `apps/open-graze/app/page.tsx`
- `apps/open-graze/app/layout.tsx`
- `apps/open-graze/app/components/app-chrome.tsx`
- `apps/open-graze/app/dashboard/page.tsx`
- `apps/open-graze/app/login/page.tsx`
- `apps/open-graze/app/register/page.tsx`
- `.ralph/parallel/1777813574-de7e4b8b/agent-job7.md` (본 문서)

## 테스트 실행

```bash
cd apps/open-graze
npx eslint app/page.tsx app/layout.tsx app/components/app-chrome.tsx app/dashboard/page.tsx app/login/page.tsx app/register/page.tsx
```

전체 워크스페이스 `npm run lint`는 기존 이슈로 실패할 수 있습니다(예: `app/dashboard/[slug]/page.tsx` JSX 파싱, `prisma/seed.cjs` 규칙).

## 후속 개선 체크리스트 (`- [ ]`)

- [ ] **README**: 첫 방문자용 한 단락 가치 제안(에이전트+제품 한 타임라인, `/llms.txt`, self-test)과 스크린샷·배지 링크 추가
- [ ] **README**: CTA 섹션(배포 URL, 로컬 `pnpm dev` 한 줄, 대시보드/가입 딥링크) 정리
- [ ] **랜딩**: 실제 고객·스타 수·로고가 생기면 칩 영역을 사회적 증거로 교체(현재는 제품 특성 칩)
- [ ] **가입 플로우**: 가입 완료 후 로그인으로 보낼 때 `?registered=1`을 붙여 안내 배너와 연동(자동 로그인 실패 시나리오)
- [ ] **인앱**: 워크스페이스 상세(`dashboard/[slug]`) 등 나머지 화면에도 `/llms.txt`·가이드 경로를 동일 톤으로 반복 노출

## Gotchas

- `SHOW_LOGIN_LINKS`가 `false`이면 랜딩 주요 CTA는 **대시보드만** 표시됩니다(가입/로그인 링크 숨김과 일치).
- `registered` 쿼리는 현재 가입 성공 자동 로그인 경로에서는 쓰이지 않을 수 있으나, 로그인으로 유도하는 흐름을 추가할 때 활용 가능합니다.
- `.ralph/` 경로는 `.gitignore`에 포함될 수 있어, 보고서를 커밋할 때는 `git add -f .ralph/parallel/1777813574-de7e4b8b/agent-job7.md`가 필요할 수 있습니다.
