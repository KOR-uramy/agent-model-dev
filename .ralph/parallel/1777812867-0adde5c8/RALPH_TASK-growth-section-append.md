# 「성장·동종 비교」절 병합용 부록 — 디자인 점검 (Agent job4, parallel 1777812867-0adde5c8)

> **병렬 모드 제약**: `RALPH_TASK.md`·`.ralph/progress.md`는 직접 수정하지 않았음. 아래 **`- [ ]` 블록**을 `RALPH_TASK.md`의 `### 성장·동종 비교` 절에서 **「디자인」** 항목(타이포·색·간격·토큰 점검 문장) **아래에 하위 목록**으로 붙이거나, 오케스트레이터가 한 줄로 합친 뒤 하위로 분배한다.

## 점검 요약 (코드 기준, 2026-05-03)

- **색**: `/`(홈)은 `bg-background`·`text-muted`·`text-foreground`·`neutral-*`·역할 배지용 `slate`/`violet`/`emerald`/`amber`를 혼용하고, `/login`·`/dashboard*`는 **`zinc-*` Tailwind 팔레트**가 대부분이라 **시맨틱·다크모드 토큰과 이원화**되어 있다. 성공(에메랄드)·경고(앰버)·오류(레드)는 홈·대시보드에 **각각 다른 유틸 조합**으로 존재한다.
- **타이포**: 루트 레이아웃은 **Outfit + Source Serif 4 + Geist Mono**를 로드하나, 대시보드·로그인은 **display 세리프 위계**를 거의 쓰지 않고 `text-2xl`/`text-sm` 위주다. 홈은 `text-[11px]`·`text-[2.75rem]`·`text-[1.05rem]` 등 **임의 픽셀/rem**이 섞여 있다.
- **간격·폭**: 홈 `max-w-xl`/`sm:max-w-lg`, 로그인 `max-w-md`, 대시보드 인덱스 `max-w-2xl`, 워크스페이스 상세 `max-w-3xl`로 **콘텐츠 폭 규격이 화면마다 다르다**.
- **컴포넌트 중복**: 폼 `input`/`button`의 `rounded-lg|md border border-zinc-300 …` 패턴, `code` 인라인 `rounded bg-zinc-100 px-1`, 섹션 제목 `text-sm font-semibold uppercase tracking-wide text-zinc-500` 등이 **여러 파일에 문자열 복붙** 형태다(공용 UI 컴포넌트·`cva`·토큰 클래스 없음).
- **토큰 소스**: `app/globals.css`의 `:root`/`@theme inline`이 **브랜드 축**이나, 대시보드 경로가 이를 거의 참조하지 않는다. `@theme`에 **`--color-cta` 중복 정의**가 있어 정리 여지가 있다(에이전트 job4에서 중복 제거함).

## `RALPH_TASK.md` 「디자인」 하위에 붙일 측정 가능 `- [ ]`

구현이 끝나면 `[x]`로 두고, 전부 완료되면 메타 규약대로 동종 비교 라운드를 다시 채운다.

- [ ] **색·토큰** — `/`, `/login`, `/dashboard`, `/dashboard/[slug]`에서 **배경·본문·보조·테두리**에 쓰인 Tailwind 클래스(또는 CSS 변수)를 **화면별로 표로 추출**하고, `globals.css`의 `--background`/`--foreground`/`--muted` 등과 **1:1 매핑표**를 만든 뒤, **매핑 불가(순수 zinc만 쓰는 블록)를 5곳 이상** 나열한다. 그다음 **한 축(예: 폼 필드)** 을 골라 `zinc` → 토큰(`muted`/`foreground`/`list-border` 등)으로 바꾸는 PR 초안을 남긴다.
- [ ] **시맨틱 컬러** — **성공·경고·오류** UI를 각각 **한 스크린샷 또는 클래스 문자열**로 고정하고, `globals.css`에 `--success-*` / `--warning-*` / `--danger-*`(또는 Tailwind `@theme` 확장)를 정의한 뒤 **대시보드·홈 양쪽**에서 동일 토큰을 쓰도록 최소 2화면을 맞춘다.
- [ ] **타이포 스케일** — `text-xs`·`text-sm`·`text-base`·임의 `text-[…]` 사용처를 **grep으로 개수** 내고, **Display(세리프) / 본문 / 캡션** 3단계 이상의 **명명 규칙**(예: `text-heading-page`, `text-body`, `text-caption`)을 `globals.css` 또는 공용 유틸로 문서화한 뒤, **로그인 페이지 제목**에 display 폰트를 한 번 적용해 위계 샘플을 만든다.
- [ ] **간격·그리드** — 핵심 4경로의 **가로 패딩·max-width**를 표로 적고, **하나의 `container` 또는 레이아웃 래퍼** 컴포넌트로 통일할지 여부를 **예/아니오+한 줄 근거**로 결정한다. 예이면 `app/(app)/layout.tsx` 등으로 **첫 2경로만** 이관한다.
- [ ] **컴포넌트 중복** — `Input`·`Button`·`SectionTitle`·`InlineCode` 중 **2개 이상**을 `apps/open-graze/components/ui/`(또는 기존 관례 경로)로 추출하고, **대시보드 상세 1파일**에서 반복 문자열을 **50% 이상** 줄인다(줄 수 또는 동일 className 출현 횟수로 측정).
- [ ] **역할 배지** — `/` 타임라인의 `roleBadgeClass`를 **SDK·문서와 동일한 역할 키**로 유지한 채, 색만 **디자인 토큰 또는 단일 맵 파일**(`lib/role-badge-styles.ts` 등)로 옮겨 **페이지 TSX 밖**에서 스타일을 조정할 수 있게 한다.

---

오케스트레이터가 **progress.md**에 한 줄 넣을 때 예시: `디자인 점검(2026-05-03 parallel 1777812867 job4): 토큰·타이포·간격·중복 — 세부는 .ralph/parallel/1777812867-0adde5c8/RALPH_TASK-growth-section-append.md`
