# Agent job2 — 핵심 화면 UI 정합성

## 변경 요약

- **홈 (`/`)**: 헤더 로고 링크의 잘못된 종료 태그(`</span>`)를 수정하고, 상단 내비를 동종 Saa스형(줄바꿈·간격 통일, 중복 로그인 링크 제거)으로 정리했습니다.
- **로그인 (`/login`)**: `AppChrome` + `AuthCard`로 레이아웃을 가입 화면과 맞추고, `text-muted`·코드 블록 스타일을 토큰 기반으로 통일했습니다. `registered=1` 시 안내 배너, 하단에 회원가입·홈 링크를 추가했습니다.
- **가입 (`/register`)**: 제목에 `font-display` 적용, 홈으로 가는 보조 링크, Suspense fallback을 `AuthCard`로 통일했습니다.
- **대시보드 목록 (`/dashboard`)**: 본문이 `AppChrome`/`AppMain` 밖에 있던 잘못된 JSX를 바로잡고, 설명 타이포를 `text-muted`·모노스페이스 코드 스타일로 다른 앱 화면과 맞췄습니다.
- **워크스페이스 상세 (`/dashboard/[slug]`)**: 깨진 마크업(잘못된 `</div>`, 중복된「수집용 API 키」블록, 중첩된 삭제 버튼)을 제거하고 단일 카드 섹션으로 합쳤습니다. 요율 제한 안내를 디자인 토큰으로 통일하고, 새 토큰에 대해 기존 핸들러를 쓰는「키만 복사」「.env 스니펫 복사」버튼·`copyHint` 표시·키 목록 빈 상태를 연결했습니다. 연동 예시 URL은 `publicOrigin` 상태로 일관 표시합니다.

## 수정·추가한 파일

- `apps/open-graze/app/page.tsx`
- `apps/open-graze/app/login/page.tsx`
- `apps/open-graze/app/register/page.tsx`
- `apps/open-graze/app/dashboard/page.tsx`
- `apps/open-graze/app/dashboard/[slug]/page.tsx`
- `.ralph/parallel/1777813574-de7e4b8b/agent-job2.md` (본 문서)

## 테스트 실행 방법

- 앱 타입·린트(앱 소스만):  
  `cd apps/open-graze && npx eslint app`
- 프로덕션 빌드(워크스페이스 루트):  
  `npm run build`

별도 단위 테스트 스위트는 없습니다. `npm run lint -w open-graze`는 기존 `prisma/seed.cjs` 규칙 때문에 실패할 수 있습니다.

## 주의사항 (gotchas)

- `.ralph/`가 `.gitignore`에 있으면 리포트 커밋 시 `git add -f .ralph/parallel/1777813574-de7e4b8b/agent-job2.md`가 필요할 수 있습니다.
- 루트 `npm run lint`는 `seed.cjs`의 `require` 규칙으로 실패할 수 있어, 변경 검증은 `npx eslint app` 또는 `next build`를 권장합니다.
- Next가 상위 디렉터리의 `package-lock.json`을 워크스페이스 루트로 추론한다는 경고가 나올 수 있습니다(기존 환경 이슈).

---

## 동종 SaaS 대비 남은 갭 — 재현 가능한 개선 체크리스트

다음은 레이아웃·밀도·일관성을 한 단계 더 맞추기 위한 후속 작업입니다.

- [ ] 홈(`/`) 헤더를 `AppChrome`과 공유 컴포넌트로 추출해 마케팅 랜딩과 앱 셸의 높이·보더·블러를 100% 동일하게 맞춘다.
- [ ] 로그인·가입 폼에 공통 `FormField` 래퍼(라벨·힌트·에러 영역 높이)를 두어 필드 간 세로 리듬을 수치로 고정한다.
- [ ] 대시보드 목록의 워크스페이스 카드에 아바타/이니셜 타일·역할 배지를 추가해 Notion/Linear 스타일 정보 밀도를 맞춘다.
- [ ] 워크스페이스 상세 상단에「표시 이름 + slug」이중 제목을 API에서 받아 표시하고, breadcrumb을 `대시보드 > slug > (탭)` 형태로 확장한다.
- [ ] 수집 이벤트 `JSON.stringify` 블록을 접이식 테이블(시각·kind·요약 컬럼)로 바꿔 가로 스크롤 의존도를 줄인다.
- [ ] 다크 모드 전환 토글을 `AppChrome`에 추가하고 `globals.css` 토큰과 동기화한다(현재는 `prefers-color-scheme`만).
- [ ] 키 발급 직후 토큰을 `font-mono`·선택 가능 영역으로만 표시하고, 화면 나머지에는 마스킹된 프리뷰만 보이게 한다(보안·밀도).
