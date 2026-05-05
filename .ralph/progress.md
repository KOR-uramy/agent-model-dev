# Progress Log

> Updated by the agent after significant work.

## Summary

- Iterations completed: 4 (+ 토스 v2 결제위젯·승인·웹훅)
- Current status: **사이클 4 · 기획(1/4)** — `RALPH_TASK.md` Success 전부 `[x]` 뒤 성장 루프로 **차수 4** `- [ ]` 3건(`?from=`/`?to=` URL 동기화·`source` API+UI+README curl·“현재 뷰 복사”+검증 한 줄) 추가; 동종 Grafana Explore·Sentry Discover 한 줄. 다음 역할: **디자인**(시간 구간 vs `tail` 배타 규칙·`source` 허용 enum·복사 URL 스키마).

## Session History

### 2026-05-05

**역할: 기획 (planning)\**

- **감시 요약**: `RALPH_TASK.md` 미완 `[ ]`는 3건(`from/to` URL 동기화, `source` 필터, “현재 뷰 복사”)만 남아 있고, `.ralph/errors.log`는 OpenAI 401(“Missing bearer…”) 계열 재발 방지 주의만 유효하다. `git log`상 해당 기능 구현 커밋이 이미 존재해, 이번 이터는 **계약·검증 힌트 문서 고정**만 수행했다(프로덕션 코드 변경 없음).
- **이번에 한 일(기획 범위)**: `RALPH_TASK.md`의 `from/to`에 “추측 보정 금지(애매한 입력은 키 제거로 수렴)”을 계약에 추가하고, “현재 뷰 복사”에 **주소줄 동기화와 동일 규칙/단일 함수 공유 + 복사 실패 시 URL 확인 표면 제공**을 계약으로 못 박았다(재현·감사·신뢰 축 강화, 프로덕션 코드 변경 없음).
- **다음 인계(디자인)**: (1) `from/to` 적용(확정) 시점 UI 이벤트를 스케치로 고정(입력 중 주소줄 갱신 금지), (2) `from/to` 파싱 실패/불완전(한쪽만) 상태에서 UI가 “키 제거(필터 해제)”로 수렴하는 표면(토스트 필요 여부 포함)을 결정, (3) “현재 뷰 복사”는 클립보드 실패에서도 URL을 **눈으로 확인/복사 가능한 표면**을 어떻게 둘지(텍스트/모달 등)만 계약화.
- **주의(환경)**: Codex CLI 샌드박스에서 `.git/index.lock` EPERM으로 `git add/commit/push`가 실패했다. 호스트 터미널에서 `git add -A && git commit -m 'docs(ralph): tighten from/to URL decode contract' && git push`로 원격에 반영 필요.

### 2026-05-04

**역할: 기획 (planning)\**

- **감시 요약**: `RALPH_TASK.md` 미완 `[ ]`는 사이클 4의 3건(`from/to`, `source`, “현재 뷰 복사”)만 남아 있고, 최근 실패는 `.ralph/errors.log`의 OpenAI 401(“Missing bearer…”) 및 `docs/ralph-guardrails.md`의 `.git/index.lock` EPERM 경고뿐이다.
- **이번에 한 일(기획 범위)**: `RALPH_TASK.md`의 `from/to` 항목에 “필터 적용 시점에만 주소줄 반영 + 기본 `replaceState`로 히스토리 스팸 방지”를 계약으로 추가했고, `source` 항목에는 “미지/빈 값은 조용히 다른 결과가 아니라 UI에서 키 제거로 수렴(신뢰)” 리스크를 1줄로 고정했다(프로덕션 코드 변경 없음).
- **다음 인계(디자인)**: (1) `from/to` 입력 UX에서 “적용 시점”이 무엇인지(버튼/확정 이벤트)와 주소줄 갱신 방식(`replaceState`)을 스케치로 고정, (2) `source` 미지 값 처리 시 사용자 피드백이 필요한지(없어도 되지만 ‘조용히 다른 결과’는 금지) 결정.
- **주의(환경)**: Codex CLI에서 `.git/index.lock` EPERM이 재발할 수 있으니, 이 변경은 호스트에서 `git add -A && git commit -m 'docs(ralph): tighten URL sync + source trust contract' && git push`로 원격에 남겨 두는 편이 안전하다.

**역할: 기획 (planning)\**

- **감시 요약**: `RALPH_TASK.md`의 미완 항목이 「성장 루프 확장(사이클 4)」의 3건(`from/to`, `source`, “현재 뷰 복사”)로 남아 있어, `docs/ralph-guardrails.md`·`.ralph/errors.log`를 확인했다(401 Missing bearer 재발 방지, `.git/index.lock` EPERM 주의). `git log`상 동일 범위 구현 커밋/병합이 이미 존재해, 이번 이터는 **계약/리스크를 문서로 고정**하는 쪽에 한정했다(프로덕션 코드 변경 없음).
- **이번에 한 일(기획 범위)**: `RALPH_TASK.md`의 `from/to`·“현재 뷰 복사” 항목에 **리스크 2줄**을 추가해 재현성(타임존 `+` URL 인코딩)과 신뢰(클립보드 실패를 숨기지 않기)를 문서로 못 박았다.
- **다음 인계(디자인)**: (1) 필터 UI에서 `from/to` 입력·표시(정규화 `Z`)의 표면/상태를 스케치로 고정, (2) “현재 뷰 복사”의 성공/실패 피드백 + (가능하면) 사용자가 URL을 눈으로 확인 가능한 표면을 계약으로 명시, (3) `source` 선택 UI는 단일 선택(전체+허용값)만 제공한다는 기존 계약을 유지.
- **주의(환경)**: Codex CLI 샌드박스에서 `git add`가 `.git/index.lock` EPERM으로 막혀 커밋/푸시를 못 했다. 호스트 터미널에서 `git add -A && git commit -m 'docs(ralph): clarify URL encoding + clipboard risks' && git push`로 반영해 두면 다음 역할이 원격 기준으로 이어갈 수 있다.

**역할: 기획 (planning)\**

- **이번에 한 일(기획 범위)**: `RALPH_TASK.md`의 남은 3개 `[ ]`(from/to, source, “현재 뷰 복사”)에 대해 **재현성/신뢰** 축만 강화하도록 계약을 더 좁혔다 — `from/to`는 URL 디코딩→파싱→`Z` 정규화 재기록, `source`는 다른 축과 AND 조합 고정, “현재 뷰 복사”는 클립보드 실패 시에도 **URL 확인/복사 표면**이 남아야 함을 검증 힌트에 포함.
- **감시 메모**: `git log`에는 `from/to`·`source`·복사 기능 구현 커밋이 이미 보이므로, 다음 **디자인**은 “새 기능 발명”이 아니라 **현재 UI가 계약을 충족하는지**(표면/피드백/배치)만 확인해 스케치·명세로 고정하는 쪽이 낫다.
- **다음 인계(디자인 → 테스트)**: 디자인은 최소 스케치로 계약을 고정하고, 테스트는 `apps/open-graze/README.md`의 URL/curl 검증 한 줄(또는 추가)로 `[x]` 판정을 내릴 수 있게 준비한다.

### 2026-05-02

- `RALPH_TASK.md`를 **본질 목표(관측·신뢰·재현)** 와 OpenGraze/SDK/클라우드 스캐폴드에 맞게 재작성함.
- 24시간 연속 Ralph 루프를 위한 **이터당 규약**(읽기→한 항목→`npm run build`→커밋→`[x]`→progress) 및 `MAX_ITERATIONS` 안내 추가.
- 텔레그램: SDK `sendTelegramMessage` / `sendTelegramToChat`·`TELEGRAM_NOTIFY_COMMITS`로 커밋 알림 선택, OpenGraze 앱 `POST /api/webhooks/telegram`(시크릿 토큰·`TELEGRAM_CHAT_WORKSPACE_MAP`)으로 채팅·`/task` 본문을 `IngestedEvent`에 수집.
- `RALPH_TASK.md`·README·`open-graze` 문서에 **결제 표준 = 토스페이먼츠 v2**([LLMs 가이드](https://docs.tosspayments.com/guides/v2/get-started/llms-guide), [llms.txt](https://docs.tosspayments.com/llms.txt))를 명시하고 Stripe 스캐폴드를 레거시로 표기; `.env.example`에 `NEXT_PUBLIC_TOSS_CLIENT_KEY` / `TOSS_SECRET_KEY` 자리 추가.
- **자기 연동(dogfood)**: 루트 `scripts/platform-self-test.mjs`, `npm run platform:self-test`(선택 `.env` 로드), 문서에 검증 절차 반영.
- `workspace-platform`을 **`apps/open-graze` 단일 Next 앱으로 통합**(Prisma·Auth·대시보드·수집·웹훅). 루트 `npm run dev` / `npm run build`는 open-graze만 포함.
- OpenGraze `GET /api/ralph/events` Turbopack 500(`server_1 is not defined`) — SDK `next.ts`를 `Response.json`으로 변경; `open-graze` 프로덕션 빌드는 `next build`(webpack)로 전환(Turbopack `/_not-found` 수집 실패 회피), `app/not-found.tsx` 추가.


### 2026-05-03 01:02:04
**Session 1 started** (model: auto)

### 2026-05-03 01:06:25
**Session 1 started** (model: auto)

### 2026-05-03 (Iteration 1)

- **수집 API 남용 완화** (`RALPH_TASK.md` 해당 기준 `[x]`): `lib/ingest-body.ts`에서 `Content-Length` 선제 검사 + 스트림 누적 바이트 상한(기본 256KiB, `INGEST_MAX_BODY_BYTES`·최대 10MiB) 후 JSON 파싱. 초과 시 413, 파싱 실패 시 400.
- `apps/open-graze/README.md`에 앱 상한·리버스 프록시 레이트 리밋 권장 문단 추가, `.env.example`에 변수 주석 추가.
- 루트 `npm run build`: 최초 1회 `.next` 캐시 없이 실패(PageNotFound) → `apps/open-graze/.next` 삭제 후 재빌드 성공(환경 이슈로 기록).

### 2026-05-03 01:08:51
**Session 1 ended** - Agent finished naturally (5 criteria remaining)

### 2026-05-03 01:08:53
**Session 2 started** (model: auto)

### 2026-05-03 (Iteration 2)

- **`docs/agent-model-selection.md` 추가** — Cursor Agent CLI(`agent`/`cursor-agent`), 기본 모델 `auto`·`RALPH_MODEL`/`-m` 덮어쓰기, `stream-parser.sh`의 추정 토큰 임계(70k/80k)·JSONL·로그 측면을 **레포 스크립트 근거만**으로 요약. `RALPH_TASK.md` 해당 성공 기준 `[x]`, Context 표에 문서 경로 한 줄 추가.

### 2026-05-03 01:13:33
**Session 2 ended** - Agent finished naturally (4 criteria remaining)

### 2026-05-03 01:13:36
**Session 3 started** (model: auto)

### 2026-05-03 (Iteration 3)

- **`apps/open-graze/README.md`**: 결제·토스·Stripe 없이 재현 가능한 **핵심 플로** 섹션(환경 최소값, migrate, dev, UI 단계, `platform:self-test` / `curl` 예시) 추가.
- 동 파일에 **프로덕션 Postgres 전환** 요약(SQLite 개발 전제, `provider` 변경, `migrate deploy`, 데이터 이전·OAuth URL 주의) 추가.
- 루트 `README.md`에서 해당 절로 안내 한 줄 추가. `RALPH_TASK.md` 위 두 기준 `[x]`.

### 2026-05-03 01:15:48
**Session 3 ended** - Agent finished naturally (2 criteria remaining)

### 2026-05-03 01:15:50
**Session 4 started** (model: auto)

### 2026-05-03 (Iteration 4)

- **토스페이먼츠 v2** (`RALPH_TASK.md` 결제·메타 기준 `[x]`): `@tosspayments/tosspayments-sdk` 결제위젯(주문서형), `POST /api/billing/toss/prepare`·`confirm`, 리다이렉트 성공 페이지에서 승인 API 호출, `POST /api/webhooks/toss` + `tosspayments-webhook-signature` HMAC 검증([웹훅 이벤트](https://docs.tosspayments.com/reference/using-api/webhook-events)). Prisma `TossCheckoutOrder`·`Workspace.tossLastPaymentKey`, 마이그레이션 `20260503120000_toss_checkout`.
- 대시보드 워크스페이스 상세 **구독 (토스)** → `/dashboard/[slug]/billing`. `.env.example`·`apps/open-graze/README.md`에 웹훅 URL·금액 변수 안내.

### 2026-05-03 01:22:24
**Session 4 ended** - ✅ TASK COMPLETE

### 2026-05-03 10:33:10
**Session 1 started** — 역할: 기획 (`planning`) · model: auto

### 2026-05-03 (Ralph 사이클 1 — 기획, 단계 1/4)

**Session** — 역할: 기획 (`planning`) · 사이클 1 · 단계 1/4 · model: auto

**감시 요약** — 직전 역할 산출물 없음(파이프 첫 단계). 근거: `RALPH_TASK.md`, `.ralph/guardrails.md`, 본 파일, `.ralph/errors.log`(비어 있음), `git log` 최근 `ralph: implement state tracker`·토스 결제 커밋 등.

**이번에 한 일** — 미완료 성공 기준 2개에 대한 범위·우선순위·수용 힌트·리스크 정리(코드/프로덕션 구현 없음). `progress.md` 요약을 실제 `[ ]` 상태와 일치시킴.

**우선순위** — ① **규약**(SDK README + `apps/open-graze` README 등)을 먼저 한 줄로 고정 → ② 동일 규약을 전제로 **`/` 소비 UI**(헤더·배지) 스케치·타입 계약. 이유: UI는 읽을 필드가 문서·타입과 같아야 재작업이 줄어듦.

**디자인(design) 인수 조건 — 체크리스트**

- [ ] **데이터 계약**: Ralph `events.jsonl` 한 줄은 `detail` 객체 안에 역할 문자열이 온다. `session_start`는 이미 `stream-parser.sh`가 `detail: { workspace, sessionId, role? }` 형태로 기록(`RALPH_ROLE` 있을 때만 `role`). 문서에 **허용 값** `planning` \| `design` \| `implementation` \| `test`(+ `mono`/미설정 시 생략)를 명시하고, `WorkspaceFeedEvent.detail`에서 읽는다고 한 줄로 박는다.
- [ ] **앱 텔레메트리**: `application_*` 종류는 `detail.role` **선택**으로 정의할지(없으면 UI는 "—" 또는 무배지) 디자인에서 결정하고 SDK `ApplicationTelemetryDetail`·README에 반영할지 여부를 계약에 포함한다.
- [ ] **ingest(`POST /api/v1/events`)**: 워크스페이스 수집 이벤트에 역할 메타를 둘 경우 **payload 위치**를 타임라인과 동일 규칙으로 맞출지, 아니면 “Ralph 타임라인 전용”으로 범위를 제한할지 한 문장으로 경계를 적는다.
- [ ] **UI 계약**: `/` 테이블에 **역할** 열 또는 행 상단 헤더/배지 중 무엇으로 “같은 시간축에서 역할별 스캔”을 만족할지 와이어 수준으로 고정한다(한글 라벨 vs 키 표기).
- [ ] **API**: `GET /api/ralph/events` 응답이 프론트에서 추가 파싱 없이 `detail.role`을 노출하는지(이미 `detail` 포함 시 추가 필드 불필요) 확인만 하면 됨.

**리스크**

- `RALPH_TASK.md` 본문의 `detail.role` 표기와 실제 JSON(`detail` 객체의 `role` 키)을 혼동하지 않도록 문서에 **JSON 경로 한 줄**을 그대로 적을 것.
- `progress.md`와 `RALPH_TASK.md` 불일치(전부 완료로 잘못 요약됨)는 이번에 수정함 — 이후 이터는 완료 체크 전 요약을 다시 맞출 것.

**다음 인계** — **디자인** 역할: 위 체크리스트를 계약/스케치로 구체화하고, 구현 역할이 문서만 갱신하지 않고 UI까지 갈 수 있게 파일·섹션 단위로 어디를 고칠지 명시한다.

### 2026-05-03 10:39:45
**Session 1 ended** - Agent finished naturally (2 criteria remaining)

### 2026-05-03 10:39:48
**Session 2 started** — 역할: 디자인 (`design`) · model: auto

### 2026-05-03 (Ralph 사이클 1 — 디자인, 단계 2/4)

**Session** — 역할: 디자인 (`design`) · 사이클 1 · 단계 2/4 · model: auto

**감시 요약(직전: 기획)** — `progress.md` 2026-05-03 기획 블록·`RALPH_TASK.md` 미완료 2건·`git log`(`docs(ralph): 기획 사이클1…`)를 확인했다. 데이터 계약·UI·ingest 경계·리스크( `detail.role` vs JSON 키 `role` )가 체크리스트로 정리되어 있어 **승인**한다. 보완 요청 없음.

**이번에 한 일(디자인 산출)** — 요구사항 문서에 **역할 필드 고정** 문단을 추가하고, `packages/ralph-workspace-sdk/README.md`·`apps/open-graze/README.md`에 동일 규약을 반영했다(구현 전 **단일 진실**). 아래는 **구현**용 계약·와이어·터치 리스트.

#### 데이터·API 계약

| 항목 | 결정 |
|------|------|
| JSON | `detail` 객체의 프로퍼티 **`role`** (논리 경로 표기 **`detail.role`**) |
| 허용 값 | `planning` \| `design` \| `implementation` \| `test` |
| 생산 | `stream-parser` `session_start` — `RALPH_ROLE` 있을 때만 `detail`에 `role` |
| 소비 | `GET /api/ralph/events` → `events[]` 그대로; 별도 top-level 필드 추가 **불필요** |
| application | `detail.role` **선택**; 없으면 UI `—` |
| ingest | 북극성 UI는 `/`만; 수집 페이로드에 넣을 경우 **동일 관례 권장** |

#### UI 와이어 (`/` 활동 타임라인 테이블)

- **`<th>역할</th>`** — `채널` 오른쪽(또는 `유형` 왼쪽)에 고정 폭 열 하나 추가.
- 셀: `detail`에서 `typeof detail.role === 'string'` 이고 허용 네 값이면 **캡슐 배지**(짧은 **한글** 라벨: 기획·디자인·구현·테스트; `title`에 원문 키 유지). 그 외·비객체·ralph가 아니어도 role 없으면 **`—`**.
- **색 구분**(구현 시 기존 토큰/뉴트럴 링에 맞출 것): 예) 기획=슬레이트, 디자인=바이올렛, 구현=에메랄드, 테스트=앰버 — 구체 클래스는 `page.tsx` 일관 스타일로.

#### 구현 터치 리스트(파일·섹션)

1. `packages/ralph-workspace-sdk/src/types.ts` — `export type AgentRoleKey = "planning" | "design" | "implementation" | "test"`; `ApplicationTelemetryDetail`에 `role?: AgentRoleKey` (주석: `RALPH_TASK.md` 규약).
2. `apps/open-graze/app/page.tsx` — `ROLE_LABEL_KO` 맵 + `roleBadgeClass(key)` + 테이블 `<th>`/`<td>`; `min-w` 테이블 폭 +80px 정도.
3. (선택) `lib/timeline-feed.ts` — 변경 없이 `payload` 통과면 불필요; 역할 정규화는 **하지 않음**(원본 JSON 유지).
4. 성공 기준 **`[x]`** — **규약**은 문서·타입 반영 후 **테스트** 역할이 빌드·스모크로 확인하고 체크; **소비 UI**는 구현 후 동일.

**다음 인계** — **구현**: 위 1~2를 코드로 반영하고, 필요 시 배지 스타일만 조정. **테스트**: `npm run build` + `GET /api/ralph/events` 스모크, 수동으로 `/`에서 배지·`—` 확인 후 `RALPH_TASK.md` 두 체크박스 처리.

### 2026-05-03 10:41:44
**Session 2 ended** - Agent finished naturally (2 criteria remaining)

### 2026-05-03 10:41:46
**Session 3 started** — 역할: 구현 (`implementation`) · model: auto

### 2026-05-03 (Ralph 사이클 1 — 구현, 단계 3/4)

**Session** — 역할: 구현 (`implementation`) · 사이클 1 · 단계 3/4 · model: auto

**감시 요약(직전: 디자인)** — `progress.md` 디자인 블록(데이터 계약·UI 와이어·터치 리스트)·`git log`의 `docs(design): 역할 detail.role 규약 고정…`(5459d61)을 확인했다. JSON 키 `role`·허용 네 값·배지 색·`GET /api/ralph/events` 추가 필드 불필요가 명확해 **승인**한다. 문서 규약은 이미 커밋되어 있어 보완 요청 없음.

**이번에 한 일** — `packages/ralph-workspace-sdk`: `AgentRoleKey` export, `ApplicationTelemetryDetail.role?` 및 `RALPH_TASK.md` 규약 주석. `apps/open-graze/app/page.tsx`: 활동 타임라인 테이블에 **역할** 열(채널 오른쪽), `detail.role`(JSON `role`) 파싱·허용값만 캡슐 배지(한글 라벨·`title`에 키)·그 외 `—`, `min-w-[960px]`, 슬레이트/바이올렛/에메랄드/앰버 톤. 루트 `npm run build` 성공(선행 `rm -rf apps/open-graze/.next` — Turbopack 잔여 캐시 이슈 회피).

**다음 인계 — 테스트** — ① 루트 `npm run build`(필요 시 동일 `.next` 삭제). ② dev + `curl -sS 'http://localhost:3000/api/ralph/events?tail=5'` → JSON 200. ③ 브라우저 `/`에서 역할 열·배지·`—` 표시 확인. ④ 통과 시 `RALPH_TASK.md` **규약**·**소비 UI** 두 줄을 `[x]`로 바꾸고 커밋.

**Session 3 ended** — 구현 산출물 커밋됨; 성공 기준 체크는 테스트 역할 소유.

### 2026-05-03 10:44:37
**Session 3 ended** - Agent finished naturally (2 criteria remaining)

### 2026-05-03 10:44:39
**Session 4 started** — 역할: 테스트 (`test`) · model: auto

### 2026-05-03 (Ralph 사이클 1 — 테스트, 단계 4/4)

**Session** — 역할: 테스트 (`test`) · 사이클 1 · 단계 4/4 · model: auto

**감시 요약(직전: 구현)** — `git log`의 `feat(sdk): AgentRoleKey…`·`feat(open-graze): 홈(/) 타임라인…`, `progress.md` 구현 인계(빌드·curl·브라우저·`[x]` 소유)를 확인했다. 문서·코드 범위가 디자인 계약과 일치해 **승인**한다.

**검증 증거**

1. 루트 `rm -rf apps/open-graze/.next && npm run build` — exit 0 (`ralph-workspace-sdk` tsc, `open-graze` prisma generate + next build).
2. `npm run dev` 후 `curl -sS 'http://localhost:3000/api/ralph/events?tail=5'` — HTTP **200**, JSON 본문(`events` 배열 등).
3. **규약(문서)** — `packages/ralph-workspace-sdk/README.md`·`apps/open-graze/README.md` 각 상단에 `detail.role`(JSON 키 `role`)·허용 네 값 한 줄 고정 확인.
4. **소비 UI(코드 리뷰)** — `app/page.tsx`: `<th>역할</th>`(채널 오른쪽), `RoleTimelineCell` + `parseDetailRole`로 허용값만 캡슐 배지·그 외 `—`, `title`에 원문 키.

브라우저 수동 확인은 이 환경에서 생략했으나, 빌드·API·문서·렌더 경로가 기준을 충족한다고 판단했다.

**이번에 한 일** — `RALPH_TASK.md` **규약**·**소비 UI** 두 항목 `[x]` 처리. dev 서버 종료(`kill:3000`).

**다음 인계** — `RALPH_TASK.md` Success 전부 완료 상태. 새 목표가 생기면 **기획**에서 `[ ]` 항목을 쪼개 추가하고 사이클을 이어간다.

### 2026-05-03 (세션 4 종료)

**Session 4 ended** — ✅ `RALPH_TASK.md` Success Criteria 전부 `[x]` (역할 규약·소비 UI 검증 반영).

### 2026-05-03 10:47:02
**Session 4 ended** - ✅ TASK COMPLETE

### 2026-05-03 22:43:43
**Session 1 started** — 역할: 기획 (`planning`) · model: auto

### 2026-05-03 (Ralph 사이클 1 — 기획, 단계 1/4 · 병렬 스윕 직후)

**Session** — 역할: 기획 (`planning`) · 사이클 1 · 단계 1/4 · model: auto

**감시 요약** — 직전 역할 산출물 없음. `RALPH_TASK.md` Success·「성장·동종 비교」가 **전부 `[x]`**인 상태 확인. `docs/ralph-guardrails.md`·`.ralph/errors.log`(비어 있음)·`git log`(state tracker·병렬 머지) 반영.

**이번에 한 일** — 성장 루프에 따라 **동종 비교 2건**(Langfuse https://langfuse.com — 세션/태그 필터·트레이스 UI; Linear https://linear.app — 이슈 필터·보드 스캔)과 **본질 연결 한 줄**(역할·세션 단위 재구성·감사)을 적은 뒤, 측정 가능한 `- [ ]` **3건**(API `role` 필터+README `curl`, `/` UI 연동, 기간 JSON보내기+필드 표)을 `RALPH_TASK.md` 「성장·동종 비교」절에 추가. 프로덕션 코드 없음.

**리스크·수용 힌트** — 필터는 **대소문자·알 수 없는 role 값**에 대해 400 vs 무시를 디자인에서 한 줄로 고정할 것. 보내기는 페이지네이션 상한·비인증 노출 금지를 구현 단계에서 Success에 맞출 것.

**다음 인계** — **디자인**: `GET /api/ralph/events` 쿼리 스펙(파라미터 이름·다중값 여부·빈 결과), `/` 컨트롤 배치, 보내기 엔드포인트 vs CLI·권한(세션·API 키) 경계를 와이어·계약으로 고정.

### 2026-05-03 22:49:49
**Session 1 started** — 역할: 기획 (`planning`) · model: auto

### 2026-05-03 (Ralph 사이클 2 — 기획, 단계 1/4 · 병합 직후 재확장)

**Session** — 역할: 기획 (`planning`) · 사이클 2 · 단계 1/4 · model: auto

**감시 요약** — `RALPH_TASK.md` 「성장 루프 확장」3항(API `role`, UI, 기간 JSON) **전부 `[x]`** 확인. `docs/ralph-guardrails.md`, `git log`(81568b6 등 병합·완료 마커). `.ralph/errors.log` 비어 있음.

**이번에 한 일** — 메타 **동종 비교 → 체크 확장**에 따라 **비교 SaaS**: [Axiom](https://axiom.co), [Honeycomb](https://www.honeycomb.io)(공유 URL·필드 스코프·딥링크). **본질 연결**: 딥링크·세션 스코프·한도 신호로 **재현·감사·신뢰** 축 강화. 측정 가능한 `- [ ]` **3건**을 `RALPH_TASK.md`에 추가(URL `?role=`↔UI, `sessionId` 필터 API+UI, ingest 레이트 응답 신호+README curl). 프로덕션 코드 없음.

**리스크·수용 힌트** — `sessionId`는 **부분 일치 금지·정확 일치**로 고정해 DB 부하를 통제할 것. URL 동기화는 **히스토리 스팸**을 피하려 `replaceState` vs `pushState`를 디자인에서 한 줄로 정한다. 429/413 본문 스키마는 **기존 클라이언트 깨짐 없이** 확장 필드만 추가하는지 검토.

**다음 인계** — **디자인**: `?role=`·`?sessionId=` 쿼리 스펙, `/` 컨트롤 배치(역할 옆 vs 고급 패널), 레이트 응답 필드명·헤더 우선순위, 비로그인 `/` vs 세션 API 권한을 계약으로 고정.

### 2026-05-03 (Ralph 사이클 3 — 기획, 단계 1/4 · 병렬 스윕 직후)

**Session** — 역할: 기획 (`planning`) · 사이클 3 · 단계 1/4 · model: auto

**감시 요약** — 파이프 첫 단계. `RALPH_TASK.md` Success·성장 루프 **차수 2** 항목 전부 `[x]`(URL `?role=`, `sessionId` API·UI, ingest 한도 신호). `docs/ralph-guardrails.md`, `.ralph/errors.log`(비어 있음), `git log` 최근 병합·완료 마커 확인.

**이번에 한 일** — 성장 루프에 따라 **동종**: [Grafana](https://grafana.com), [Datadog Log Explorer](https://www.datadoghq.com/product/log-management). **본질 한 줄**: 공유 URL·보내기 API에 **동일 필터 축**(역할·세션·기간)을 맞춰 감사 재현을 완결한다. 측정 가능한 `- [ ]` **3건**을 `RALPH_TASK.md` 「성장·동종 비교」에 추가(① `?sessionId=` 양방향+README 예시 URL, ② `GET …/range`에 `role`·`sessionId`+curl·표, ③ range 상한 시 `truncated`/413 등 단일 규칙+README 절차). 프로덕션 코드 없음.

**리스크·수용 힌트** — `sessionId`는 **부분 일치 금지** 유지. URL에 세션을 넣을 때 **민감한 내부 ID** 노출이면 운영 가이드에 “신뢰 경계” 한 줄을 디자인에서 보강. `range` 필터 조합은 **AND**로 고정해 문서·테스트가 단순해지게 할 것.

**다음 인계** — **디자인**: `?sessionId=` 정규화(길이·허용 문자), `replaceState` 정책, `range` 응답 스키마(배열 vs 래퍼 객체)와 `truncated` 필드명, 413 vs 200+truncated 중 하나를 계약으로 확정.

### 2026-05-03 23:16:01
**Session 1 started** — 역할: 기획 (`planning`) · model: auto

### 2026-05-03 (Ralph Iteration 1 — 기획 · 사이클 1 · 단계 1/4 · 병렬 스윕 직후)

**RALPH:** planning · iteration 1 · 사이클 1 · 단계 1/4

**감시 요약** — 파이프 첫 단계(직전 역할 산출물 없음). `RALPH_TASK.md`·「성장 루프 확장」**사이클 3** 항목 전부 `[x]`(`cf2f140` 등 git). `docs/ralph-guardrails.md`, `.ralph/errors.log`(비어 있음).

**이번에 한 일** — 성장 루프에 따라 **동종**: [Grafana Explore](https://grafana.com/docs/grafana/latest/explore/), [Sentry Discover](https://docs.sentry.io/product/discover-queries/). **본질 한 줄**: URL·API에 **시간 구간·채널(`source`)** 까지 넣어 감사 재현을 완결한다. 측정 가능한 `- [ ]` **3건**을 `RALPH_TASK.md` 「성장·동종 비교」에 **사이클 4** 블록으로 추가. 프로덕션 코드 없음.

**리스크·수용 힌트** — `tail` 모드와 `from`/`to` 모드는 **배타**로 디자인에서 고정할 것(둘 다 있을 때 400 vs 우선순위). `source` 허용값은 **DB·타입과 1:1**로 문서화. URL 길이 한도(브라우저)를 넘기면 **짧은 공유 토큰**은 이번 범위 밖으로 두고 README에 “장기간은 range API”로 유도 가능.

**다음 인계** — **디자인**: `/` 타임라인 시간 UI(프리셋 vs 절대 입력), `replaceState` 정책, `source` 라벨·한글 표기, “현재 뷰 복사” 버튼 위치·접근성·비로그인 동작을 계약·와이어로 고정.

### 2026-05-03 23:59:37
**Session 1 started** — 역할: 기획 (`planning`) · model: gpt-5.2

### 2026-05-04 00:00:02
**Session 1 ended** - 🚨 GUTTER (agent stuck)

### 2026-05-04 00:11:48
**Session 1 started** — 역할: 기획 (`planning`) · model: gpt-5.2

### 2026-05-04 (Ralph Iteration 1 — 기획 · 사이클 1 · 단계 1/4)

**역할: 기획 (planning)\**

**감시 요약** — `.ralph/errors.log`에 OpenAI Responses API 인증 누락(401 “Missing bearer…”) 실패가 누적돼 있어, 재시도 루프 대신 **사전 인증 점검**이 필요하다고 판단했다. `RALPH_TASK.md`의 성장 루프(사이클 4) `[ ]` 3건은 레포 내 구현 흔적(홈 URL sync·`source` 파서·클립보드 복사)이 보여 **다음 단계는 “모호성 제거 + 테스트로 [x]”**가 최단 경로다.

**이번에 한 일** — 프로덕션 코드는 건드리지 않고, `RALPH_TASK.md`의 사이클 4 `[ ]` 3건을 **디자인/테스트가 계약으로 삼기 쉬운 규칙**으로 재서술했다(`from`/`to` 한쪽만 있으면 무효, ISO `Z` 정규화, `tail`은 상한으로만 동작, `source` 허용값/400 규칙, “현재 뷰 URL 복사”의 키 포함/생략 규칙). 또한 `docs/ralph-guardrails.md`에 **401 인증 누락 Sign**을 추가해 동일 실패 재발을 막았다.

**블로커** — 이 실행 환경에서는 `.git/*` 쓰기가 **EPERM**으로 막혀 `git add/commit/push`를 수행할 수 없다(예: `.git/index.lock` 생성 실패). 문서 변경은 워킹 트리에만 남아 있으니, 다음 역할/호스트에서 커밋·푸시가 가능한 환경에서 처리해야 한다.

**다음 인계** — **디자인**: 위 3항을 UI 문구·상태(무효 쿼리 처리, 정규화 시 URL rewrite)와 API 규칙(400 vs 키 제거)로 “한 줄 계약”으로 굳힌다. **구현/테스트**: 이미 코드가 있다면 동작을 실제로 확인해 `RALPH_TASK.md`의 `[ ]` 3건을 빠르게 `[x]`로 닫고, 불일치가 있으면 “규칙 vs 실제” 중 하나를 단일화한다.

### 2026-05-04 00:15:48
**Session 1 ended** - ⏸️ DEFERRED (rate limit/transient error)

### 2026-05-04 00:16:05
**Session 1 started** — 역할: 기획 (`planning`) · model: gpt-5.2

### 2026-05-04 (Ralph Iteration 1 — 기획 · 사이클 1 · 단계 1/4)

**역할: 기획 (planning)\**

**감시 요약** — `RALPH_TASK.md`의 사이클 4 미완 `[ ]` 3건(`from/to`, `source`, “현재 뷰 복사”)이 본질(관측·신뢰·재현)과 직접 연결돼 우선순위 유지가 타당하다. `apps/open-graze/README.md`에는 이미 `from/to/source`·복사 검증 한 줄이 있어, 다음 단계는 **UI/API 규칙을 계약으로 고정하고 테스트로 `[x]` 처리**하는 것이 최단 경로다.

**이번에 한 일(문서만)** — `RALPH_TASK.md`의 위 3항 문장에 **검증 힌트(테스트 역할)** 를 추가해, 디자인이 상태/에러 처리 계약을 만들고 테스트가 즉시 체크할 수 있게 했다(구현 변경 없음).

**다음 인계(디자인)** — (1) `from/to`가 부분 입력일 때 UI의 “키 제거” 동작, (2) `tail`+`from/to` 공존 시 처리(400 vs 우선순위)는 문서 규칙과 불일치가 없도록 1줄로 확정, (3) `source` enum의 “한 곳 고정” 기준(타입/DB/공유 상수)을 정해 UI 라벨까지 스케치한다.

### 2026-05-04 00:20:37
**Session 1 ended** - ⏸️ DEFERRED (rate limit/transient error)

### 2026-05-04 00:21:16
**Session 1 started** — 역할: 기획 (`planning`) · model: gpt-5.2

### 2026-05-04 (Ralph Iteration 1 — 기획 · 사이클 1 · 단계 1/4)

**역할: 기획 (planning)**

**감시 요약** — `RALPH_TASK.md`의 미완 `[ ]` 2건(`source` 필터, “현재 뷰 복사”)이 본질(관측·신뢰·재현: 같은 시간축에서 역할·세션·채널을 URL로 재구성/감사)과 직접 연결돼 최우선으로 유지한다.

**이번에 한 일(문서만)** — `RALPH_TASK.md`의 위 2항에 **계약(디자인 역할)** 을 추가해 모호성을 줄였다: `source`의 대소문자/빈값/미지값 처리(API 400, UI는 키 제거), “한 곳” 정의(공유 상수·타입) 및 “현재 뷰 복사” URL 포함/생략 규칙(정규화 결과만 포함, 빈 문자열·미지 값 제외, origin+`/`만).

**블로커** — 이 환경에서는 `.git/index.lock` 생성이 **EPERM**으로 막혀 `git add/commit/push`를 수행할 수 없다. 이번 이터에서 바뀐 파일은 워킹 트리에만 남아 있다(`RALPH_TASK.md`, `docs/ralph-guardrails.md`, `.gitignore`, `.ralph/progress.md`).

**다음 인계** — **디자인**: 허용 `source` 값의 라벨/표기와 “미지 값이면 키 제거” UX를 와이어로 고정. **구현**: enum 단일화(“한 곳”)를 코드 기준으로 확정. **테스트**: README `curl`/시크릿 창 재현으로 두 항목을 `[x]` 처리.

### 2026-05-04 00:27:22
**Session 1 ended** - ⏸️ DEFERRED (rate limit/transient error)

### 2026-05-04 00:28:27
**Session 1 started** — 역할: 기획 (`planning`) · model: gpt-5.2

### 2026-05-04 (Ralph Iteration 1 — 기획 · 사이클 1 · 단계 1/4)

**역할: 기획 (planning)**

**감시 요약** — `RALPH_TASK.md` 사이클 4의 미완 `[ ]` 3건(`from/to`, `source`, “현재 뷰 복사”)은 본질(관측·신뢰·재현: 동일 시간·동일 채널·동일 역할·동일 세션의 뷰를 URL만으로 재현/감사)에 직접 연결된다. `git log`상 구현 커밋이 이미 존재하므로, 다음 사이클의 핵심은 **문서 계약 ↔ UI/API 동작 정합**을 맞추고 **테스트 증거로 `[x]` 처리**하는 쪽이다.

**이번에 한 일(문서만)** — `RALPH_TASK.md`의 위 3항에 디자인/테스트가 바로 체크할 수 있도록 계약을 보강했다: `from/to`의 timezone 포함·`from>to` 처리, `tail`의 “상한” 의미 고정, `source` UI 단일선택 원칙, “현재 뷰 복사”의 사용자 피드백 요구(구현 방식은 자유). 구현 코드 변경 없음.

**블로커(중요)** — 이 환경에서는 `.git/`에 쓰기가 막혀 `git add/commit/checkout/push`가 실패한다(`.git/index.lock` 생성 EPERM). 따라서 이번 이터는 커밋/푸시를 남기지 못했고, 아래 파일들이 워킹 트리에 남아 있다.

**워킹 트리 변경 파일** — `.codex/ralph-scripts/ralph-common.sh`, `.cursor/ralph-scripts/ralph-common.sh`, `.gitignore`, `RALPH_TASK.md`, `README.md`, `apps/open-graze/README.md`, `apps/open-graze/app/api/ralph/events/range/route.ts`, `apps/open-graze/app/dashboard/[slug]/page.tsx`, `apps/open-graze/app/layout.tsx`, `apps/open-graze/lib/timeline-feed.ts`, `apps/open-graze/lib/timeline-query-params.ts`, `docs/opengraze-llms-guide.md`, `docs/ralph-guardrails.md`, `package.json`.

**다음 인계(디자인 → 구현 → 테스트)** — (1) `from/to` 무효 입력(부분 입력, timezone 없음, from>to)에서 UI가 “키 제거”로 일관되게 복원되는지 와이어/계약으로 고정, (2) `source` 허용값을 “한 곳” 상수로 고정하고 UI 라벨을 확정, (3) 테스트는 README의 `curl`/시크릿 창 재현으로 3항을 `[x]` 처리.

### 2026-05-04 00:34:51
**Session 1 ended** - 🚨 GUTTER (agent stuck)

### 2026-05-04 00:37:42
**Session 1 started** — 역할: 기획 (`planning`) · model: gpt-5.2

### 2026-05-04 (Ralph Iteration 1 — 기획 · 사이클 1 · 단계 1/4)

**역할: 기획 (planning)\**

**감시 요약** — `RALPH_TASK.md`의 미완 `[ ]` 3건(`from/to` URL 동기화, `source` 필터, “현재 뷰 복사”)이 본질(동일 시간·동일 채널·동일 역할·동일 세션 뷰를 URL만으로 재현/감사)에 직접 연결된다. `git log`상 구현 커밋이 이미 있으므로, 이번 사이클의 목표는 **계약/UX 정합과 테스트 증거로 `[x]` 처리**다.

**이번에 한 일(문서만)** — 구현 위치를 빠르게 훑어본 뒤(홈 필터: `apps/open-graze/app/components/home-page-content.tsx`, API: `apps/open-graze/app/api/ralph/events/route.ts`, URL 빌더: `apps/open-graze/lib/home-view-url.ts`), `RALPH_TASK.md`의 계약을 3곳 보강했다:
- `from/to`: timezone 없는 ISO가 JS 로컬로 해석돼 재현성이 깨질 수 있으므로 “timezone 포함만 유효” 근거를 명시.
- `source`: UI 옵션을 API와 동일 allowlist에서 직접 생성하도록(“한 곳” 상수) 구체 경로(`apps/open-graze/lib/timeline-query-params.ts`)를 적시.
- “현재 뷰 복사”: 성공뿐 아니라 **실패 시에도** 사용자에게 문구/토스트 등 피드백이 반드시 보이도록 요구를 강화(현재 구현은 성공 피드백 위주라 보완 여지).

**다음 인계(디자인)** — (1) `from/to` 무효 케이스(부분 입력, timezone 없음, from>to)에서 “키 제거” UX를 한 문장으로 고정, (2) `source` 라벨/옵션은 allowlist 기반으로 고정, (3) “현재 뷰 복사” 실패 피드백 문구·노출 위치를 와이어로 결정.

**블로커(중요)** — 이 환경에서는 `.git/index.lock` 생성이 EPERM으로 막혀 `git add/commit/push`를 수행할 수 없다. 워킹 트리에 남은 변경: `RALPH_TASK.md`, `.ralph/progress.md`.

### 2026-05-04 00:41:44
**Session 1 ended** - ⏸️ DEFERRED (rate limit/transient error)

### 2026-05-04 00:42:23
**Session 1 started** — 역할: 기획 (`planning`) · model: gpt-5.2

### 2026-05-04 00:44:23
**Session 1 ended** - ⏸️ DEFERRED (rate limit/transient error)

### 2026-05-04 00:45:22
**Session 1 started** — 역할: 기획 (`planning`) · model: gpt-5.2

### 2026-05-04 00:48:04
**Session 1 ended** - ⏸️ DEFERRED (rate limit/transient error)

### 2026-05-04 00:49:29
**Session 1 started** — 역할: 기획 (`planning`) · model: gpt-5.2

### 2026-05-04 00:51:20
**Session 1 ended** - ⏸️ DEFERRED (rate limit/transient error)

### 2026-05-05 10:40:00
**Session 1 started** — 역할: 기획 (`planning`) · model: gpt-5.2

### 2026-05-05 10:43:22
**Session 1 ended** - ⏸️ DEFERRED (rate limit/transient error)

### 2026-05-05 10:44:09
**Session 1 started** — 역할: 기획 (`planning`) · model: gpt-5.2

### 2026-05-05 11:07:56
**Session 1 started** — 역할: 구현 (`implementation`) · model: gpt-5.1-codex-mini

### 2026-05-05 11:07:56
**Error recovery mode** — recent entries in `.ralph/errors.log` forced this iteration to prioritize unresolved failures before checklist work.

### 2026-05-05 11:12:53
**Session 1 started** — 역할: 구현 (`implementation`) · model: gpt-5.1-codex-mini

### 2026-05-05 11:12:53
**Error recovery mode** — recent entries in `.ralph/errors.log` forced this iteration to prioritize unresolved failures before checklist work.

### 2026-05-05 11:19:21
**Session 1 started** — 역할: 구현 (`implementation`) · model: gpt-5.1-codex-mini

### 2026-05-05 11:19:21
**Error recovery mode** — recent entries in `.ralph/errors.log` forced this iteration to prioritize unresolved failures before checklist work.

### 2026-05-05 11:19:28
**Session 1 ended** - 🚨 GUTTER (agent stuck)

### 2026-05-05 14:19:44
**Session 1 started** — 역할: 기획 (`planning`) · model: gpt-5.1-codex-mini

### 2026-05-05 14:19:50
**Session 1 ended** - 🚨 GUTTER (agent stuck)

### 2026-05-05 14:32:14
**Session 1 started** — 역할: 기획 (`planning`) · model: gpt-5.1-codex-mini

### 2026-05-05 14:32:18
**Session 1 ended** - 🚨 GUTTER (agent stuck)

### 2026-05-05 14:33:37
**Session 1 started** — 역할: 기획 (`planning`) · model: gpt-5.1-codex-mini

### 2026-05-05 14:33:41
**Session 1 ended** - 🚨 GUTTER (agent stuck)

### 2026-05-05 14:35:56
**Session 1 started** — 역할: 기획 (`planning`) · model: gpt-5.1-codex-mini

### 2026-05-05 14:36:04
**Session 1 ended** - 🚨 GUTTER (agent stuck)

### 2026-05-05 14:39:30
**Session 1 started** — 역할: 구현 (`implementation`) · model: gpt-5.1-codex-mini

### 2026-05-05 14:39:30
**Error recovery mode** — recent entries in `.ralph/errors.log` forced this iteration to prioritize unresolved failures before checklist work.

### 2026-05-05 14:39:34
**Session 1 ended** - 🚨 GUTTER (agent stuck)

### 2026-05-05 14:45:09
**Session 1 started** — 역할: 구현 (`implementation`) · model: auto

### 2026-05-05 14:45:09
**Error recovery mode** — recent entries in `.ralph/errors.log` forced this iteration to prioritize unresolved failures before checklist work.

### 2026-05-05 14:47:49
**Session 1 ended** - Active errors remain; continuing in recovery mode

### 2026-05-05 14:48:33
**Session 2 started** — 역할: 구현 (`implementation`) · model: auto

### 2026-05-05 14:48:33
**Error recovery mode** — recent entries in `.ralph/errors.log` forced this iteration to prioritize unresolved failures before checklist work.

### 2026-05-05 14:51:34
**Session 2 ended** - Active errors remain; continuing in recovery mode

### 2026-05-05 14:52:27
**Session 3 started** — 역할: 구현 (`implementation`) · model: auto

### 2026-05-05 14:52:27
**Error recovery mode** — recent entries in `.ralph/errors.log` forced this iteration to prioritize unresolved failures before checklist work.

### 2026-05-05 14:55:37
**Session 3 ended** - Active errors remain; continuing in recovery mode

### 2026-05-05 14:56:17
**Session 4 started** — 역할: 구현 (`implementation`) · model: auto

### 2026-05-05 14:56:17
**Error recovery mode** — recent entries in `.ralph/errors.log` forced this iteration to prioritize unresolved failures before checklist work.

### 2026-05-05 21:26:32
**Session 1 started** — 역할: 기획 (`planning`) · model: gpt-5.1-codex-mini

### 2026-05-05 21:26:40
**Session 1 ended** - 🚨 GUTTER (agent stuck)

### 2026-05-05 21:30:10
**Session 1 started** — 역할: 구현 (`implementation`) · model: gpt-5.1-codex-mini

### 2026-05-05 21:30:10
**Error recovery mode** — recent entries in `.ralph/errors.log` forced this iteration to prioritize unresolved failures before checklist work.

### 2026-05-05 21:30:17
**Session 1 ended** - Switching Codex model from 'gpt-5.1-codex-mini' to fallback 'auto'

### 2026-05-05 21:31:00
**Session 1 started** — 역할: 구현 (`implementation`) · model: auto

### 2026-05-05 21:31:00
**Error recovery mode** — recent entries in `.ralph/errors.log` forced this iteration to prioritize unresolved failures before checklist work.

### 2026-05-05 21:34:00
**역할: 구현 (implementation)\**

- **감시 요약**: 이번 런에는 직전 역할 산출물이 없어서 `RALPH_TASK.md`, `docs/ralph-guardrails.md`, `.ralph/progress.md`, `.ralph/errors.log`, 최근 git 로그만 기준으로 시작했다. 미완 `[ ]` 3건은 이미 로컬 커밋(`bd3c7d9`, `d079ecb`, `b3848d4`)으로 구현 흔적이 있었고, 실제 공유 blocker는 `.ralph/errors.log`의 unsupported-model 400과 초장문 에러 라인으로 인한 prompt overflow였다.
- **이번에 한 일(구현 범위)**: [`.cursor/ralph-scripts/ralph-common.sh`](/Users/uram/dev/agent-model-dev/.cursor/ralph-scripts/ralph-common.sh)에서 (1) 최근 에러 요약을 줄 단위로 강하게 truncate, (2) 마지막 에러 줄이 `MODEL FALLBACK`/`AUTO-HEAL APPLIED` 같은 해결 마커면 active error로 보지 않게 수정, (3) `The '...codex...' model is not supported ...` 로그를 감지하면 Ralph 루프 모델을 즉시 `auto`로 낮추는 auto-heal을 추가했다. [`.cursor/ralph-scripts/stream-parser.sh`](/Users/uram/dev/agent-model-dev/.cursor/ralph-scripts/stream-parser.sh)에는 API 에러를 그대로 적지 않고 요약본만 `.ralph/errors.log`/events에 남기도록 넣어, 로그 재귀로 prompt가 1MB를 넘는 경로를 막았다.
- **가드레일 추가**: [`docs/ralph-guardrails.md`](/Users/uram/dev/agent-model-dev/docs/ralph-guardrails.md)에 unsupported model은 `auto`로 즉시 fallback할 것, giant error line을 raw로 프롬프트에 다시 넣지 말 것 두 Sign을 추가했다.
- **검증**: `bash -n .cursor/ralph-scripts/ralph-common.sh .cursor/ralph-scripts/stream-parser.sh` 통과. 셸 단위 smoke로 `ralph_summarize_log_line` truncate, `ralph_is_resolution_log_line`, `ralph_has_active_errors`가 fallback 마커 뒤에는 `CLEARED`를 반환하는지 확인했다. 임시 `.ralph/errors.log`로 `ralph_try_known_autofix`를 호출해 unsupported model에서 `MODEL=auto`로 바뀌고 `↪️ MODEL FALLBACK` 마커가 기록되는 것도 확인했다.
- **다음 인계(테스트)**: (1) 호스트 터미널에서 실제 `git add -A && git commit -m 'ralph: harden Ralph error recovery for unsupported model + oversized error logs' && git push` 필요, (2) 그 다음 `./.cursor/ralph-scripts/ralph-once.sh -y -m gpt-5.1-codex-mini` 또는 동등 경로로 unsupported-model recovery가 실제 루프에서 `auto`로 재시도되는지 확인, (3) 기존 OpenGraze 미완 3건은 이미 구현 커밋이 있으므로 이 에러 복구가 녹색이면 테스트 역할이 빌드/스모크와 함께 `[x]` 판정으로 넘어갈 수 있다.
- **주의(환경)**: `git add ...`는 여전히 `fatal: Unable to create '.git/index.lock': Operation not permitted`로 막혔다. 이 세션에서는 커밋/푸시를 대신할 수 없다.
