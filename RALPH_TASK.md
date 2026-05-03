# Ralph Task: OpenGraze / 관측 가능한 워크스페이스 플랫폼

## Goal (본질)

**앱의 목적은 다중 에이전트 작업 모니터링이다.** Ralph 루프 안에서 역할을 **기획(planning)·디자인(design)·구현(implementation)·테스트(test)** 로 나누고, 각 작업 단위가 남기는 로그·텔레메트리에는 **역할을 식별할 수 있는 헤더(메타)** 가 붙도록 규약·UI·스크립트를 맞춘다. 운영자는 한 화면에서 **어느 역할이 무엇을 했는지**를 시간순으로 재구성·검토할 수 있어야 한다.

그 위에서 **개발·에이전트 작업이 “어디서 무엇이 얼마나 일어났는지”**를 한곳에서 재현할 수 있게 한다. 추상적인 “플랫폼 완성”이 아니라, 아래 **측정 가능한 상태**에 계속 가까워지는 것이 목표다.

1. **로컬·Ralph** — 루프는 `events.jsonl`·`workspace-telemetry.jsonl`에 쓰고, OpenGraze **`/`** 대시보드·`GET /api/ralph/events`는 **SQLite `TimelineEvent`**만 읽는다(동기화: `POST /api/ralph/sync-jsonl` 또는 `npm run sync:feed -w open-graze`). **역할 메타**는 이 파이프(JSONL → 동기화 → 타임라인·API)를 따라 끊기지 않게 전달하는 것을 목표로 한다.
2. **대외·SaaS(동일 앱)** — `apps/open-graze` 한 앱에서 **DB 이메일·비밀번호 로그인**(Credentials·JWT), 워크스페이스, API 토큰, 수집·웹훅, (설정 시) **토스페이먼츠 v2** 결제·구독 경로가 있다. (Stripe 스캐폴드는 토스 전환 전 임시·참고용.)
3. **반복** — `ralph-loop.sh`는 기본 **역할 파이프**(기획→디자인→구현→테스트)로 이터를 돌린다. 각 이터는 직전 역할의 산출물(git·`.ralph/progress.md`)을 **감시**한 뒤 본 역할만 수행한다. 한 사이클 끝에는 루트 `npm run build` 등 검증·커밋·기준 `[x]`·`.ralph/progress.md` 요약이 이어진다. 단일 프롬프트만 쓰려면 `RALPH_ROLE_MODE=mono`를 본다.

별도 앱 저장소(예: `llm_agent`) 변경은 **그 저장소에서 명시적으로 요청된 범위**에만 한정한다.

## Context

| 영역 | 위치 |
|------|------|
| Ralph 스크립트 | `.cursor/ralph-scripts/` — `ralph-loop.sh` 기본 **4역할 순환**(기획·디자인·구현·테스트) + 직전 단계 감시; `RALPH_ROLE_MODE=mono`로 비활성화 |
| OpenGraze (로컬 뷰 + 워크스페이스·수집) | `apps/open-graze` — 단일 Next 앱 |
| 연동 SDK | `packages/ralph-workspace-sdk` |
| 자기 연동 테스트 | 루트 `npm run platform:self-test` — `scripts/platform-self-test.mjs`, 루트 `.env.example`의 `OPENGRAZE_PLATFORM_*` |
| 결제 연동 규범 | 토스페이먼츠 v2 — [LLMs로 결제 연동하기](https://docs.tosspayments.com/guides/v2/get-started/llms-guide), AI/에이전트용 문서 인덱스 [llms.txt](https://docs.tosspayments.com/llms.txt) |
| 루프 상태 | `.ralph/progress.md`, `.ralph/guardrails.md`, `.ralph/errors.log` |
| 에이전트·모델 선택 근거 | `docs/agent-model-selection.md` |
| 역할별 모니터링 규약(목표) | 이벤트·텔레메트리 `detail` 등에 **역할 키**를 두고 UI에서 헤더로 노출 — 아래 Success의 `[ ]` 항목 |

연속 작업은 `ralph-loop.sh`(또는 `ralph-setup.sh`) + `cursor-agent`. **기준은 항상 이 파일**이며, 코드가 앞서가면 **먼저 여기를 고친 뒤** 구현한다.

## Ralph 원형([ralph-wiggum-cursor](https://github.com/agrimsingh/ralph-wiggum-cursor))과의 관계

이 레포는 upstream과 같은 **의도**를 쓴다: LLM 맥락은 곧 메모리 한계가 있으므로, 진행 상태는 **파일 + Git**에 두고 같은 프롬프트(과제)를 반복 돌린다. `.cursor/ralph-scripts/`, `.ralph/*`, `RALPH_TASK.md` 체크박스가 그 뼈다귀다.

**여기서 흔히 벗어나는 지점**은 두 가지다.

1. **Git** — 원형은 “다음 에이전트가 **git 히스토리**에서 이어 받는다”를 전제로 한다. Cursor 채팅만 돌리고 커밋을 안 쌓으면 Ralph가 아니라 **일회성 대화**에 가깝다. 이터(또는 논리적 덩어리)가 끝날 때마다 **커밋**하는 것을 규범으로 둔다.
2. **검증** — 빌드만으로는 번들러·런타임 조합 버그를 못 잡는다. 변경 범위에 맞는 **실행 스모크**(예: README의 `curl` / `platform:self-test`)를 같은 이터 안에서 수행한다.

`ralph-loop.sh`는 파일 상단에 **Git 저장소**를 요구한다. 루프를 안 돌리더라도, 위 두 가지는 수동으로라도 지키는 것이 upstream 컨셉에 가깝다.

## Success Criteria (Definition of Done)

### 메타 (스프린트 유지)

- [x] `RALPH_TASK.md`가 **본질 목표(다중 에이전트·역할별 모니터링, 관측·신뢰·재현)** 와 현재 레포 구조를 반영한다.
- [x] 완료된 체크는 `[x]`로 유지하고, 새 작업은 `[ ]`로만 추가한다(허위 완료 금지).

### 신뢰·보안 (본질)

- [x] 비밀(API 키, OAuth, 토스·Stripe 키, DB URL)은 **저장소에 커밋하지 않는다** (`.env.example`만).
- [x] 수집 API(`POST /api/v1/events`)에 **남용 완화** 한 가지 이상(예: 레이트 리밋, body 크기 제한, 또는 문서화된 운영 가이드).

### 재현·품질

- [x] 루트에서 `npm run build`가 **워크스페이스 전부**(sdk, open-graze) 통과한다.
- [x] `open-graze`는 배포용 `next build`(webpack)로 검증한다(Turbopack 전용 `/_not-found` 수집 버그 회피). 개발 시 `GET /api/ralph/events`는 **실행 스모크**(200·JSON)로 확인한다 — 빌드만으로는 Turbopack+CJS 번들 이슈를 잡지 못한다.
- [x] 에이전트/모델 **선택 근거**(프로바이더·버전·제약·측정)가 `docs/` 또는 루트 마크다운 **한 파일**에 요약되어 있다(추측만으로 적지 않는다).

### 제품 (로컬 Ralph + OpenGraze)

- [x] `stream-parser`가 구조화 JSONL을 남기고, SDK가 이를 읽어 대시보드에 합친다(Ralph + 앱 텔레메트리).
- [x] Git `post-commit` 등 **콜백 경로**로 텔레메트리를 쌓을 수 있다(`openg-graze-git-commit` CLI).
- [x] **한 앱 안 역할** — `/`·`GET /api/ralph/events`는 SQLite `TimelineEvent`(JSONL은 동기화로 적재); `/login`·`/dashboard`·`/api/v1/events` 등은 워크스페이스·수집 테이블(`apps/open-graze/README.md`).

### 역할별 다중 에이전트 모니터링 (제품 북극성 — 구현은 단계적으로)

역할 집합(1차): **기획 · 디자인 · 구현 · 테스트**. 저장 시 권장 키: `planning` | `design` | `implementation` | `test`(UI 표기는 한글 가능). 확장 시 이 문서와 SDK 타입을 함께 갱신한다.

**역할 필드(고정, 2026-05 디자인)** — 타임라인 한 행(`WorkspaceFeedEvent` / `TimelineEvent.payload` JSON)에서 `detail`이 객체일 때 **선택** 필드 **`role`**을 둔다. 문서·코드 주석에서는 이를 **`detail.role`**이라 부른다(JSON 키 이름은 `role`이며 `detail.role`이라는 단일 키를 쓰지 않는다). 값은 위 권장 키 네 가지 중 하나만 허용. 생략·알 수 없음이면 소비 UI는 `—`(무배지). `stream-parser`의 `session_start`는 `RALPH_ROLE`이 있을 때만 `detail`에 `role`을 넣는다(`RALPH_ROLE_MODE=mono` 등으로 역할 없으면 생략). `source: application` 텔레메트리도 동일 규칙으로 `detail.role` **선택**. 워크스페이스 **`POST /api/v1/events`** 본문에 역할을 실을 경우 동일 `detail.role` 관례를 **권장**(이번 북극성 UI는 **`/` 타임라인**만).

- [x] **규약** — `packages/ralph-workspace-sdk`·`apps/open-graze` 문서에, 타임라인·ingest에 쓸 **역할 필드 위치·형식**(예: `detail.role` 또는 동등)이 한 줄로 고정되어 있다.
- [x] **생산 경로(루프)** — `ralph-loop`/`ralph-once`가 이터마다 역할을 순환하고, `stream-parser`의 `session_start` 이벤트 `detail.role`에 `planning` \| `design` \| `implementation` \| `test`가 기록된다(`RALPH_ROLE_MODE=mono`일 때는 생략).
- [x] **소비 UI** — OpenGraze **`/`** 타임라인(및 관련 API 응답)에서 역할이 **헤더·배지 등으로 구분**되어, 같은 시간축에서 역할별 스캔이 가능하다.

### 제품 (OpenGraze 내 SaaS·수집)

- [x] 이메일·비밀번호(DB) 로그인, 워크스페이스, API 키 발급이 동작 가능한 형태로 존재한다.
- [x] **결제**는 [토스페이먼츠 LLMs 연동 가이드](https://docs.tosspayments.com/guides/v2/get-started/llms-guide) 및 [llms.txt](https://docs.tosspayments.com/llms.txt)를 따른다(결제위젯 v2·승인 API·웹훅 등). Cursor 연동 시 가이드에 안내된 **토스페이먼츠 MCP** 활용을 우선한다.
- [x] 레거시 **Stripe** Checkout/Webhook 스캐폴드는 코드에 남아 있으나, 제품 기준 결제 수단은 아니다(토스 연동 후 정리).
- [x] **텔레그램** — (로컬/SDK) `TELEGRAM_BOT_TOKEN`·`TELEGRAM_CHAT_ID`·선택 `TELEGRAM_NOTIFY_COMMITS=1`로 커밋 등 알림 가능. (클라우드) `POST /api/webhooks/telegram` + `TELEGRAM_WEBHOOK_SECRET` + `TELEGRAM_CHAT_WORKSPACE_MAP`으로 채팅 메시지·`/task 본문`을 `IngestedEvent`로 수집해 관측·작업 전달 파이프가 있다.
- [x] **자기 연동(dogfood)** — 플랫폼을 켠 뒤 대시보드에서 워크스페이스(예: `open-graze-self`)·API 키를 발급하고, **이 레포**에서 `OPENGRAZE_PLATFORM_API_KEY` 등을 두고 `npm run platform:self-test`를 실행하면 `POST /api/v1/events`로 `opengraze.self_test`가 들어가며, 같은 워크스페이스 대시보드 **이벤트** 목록에서 확인할 수 있다.
- [x] 프로덕션 배포 시 **Postgres** 전환 경로가 문서에 적혀 있다(SQLite 개발 전제 명시).
- [x] 결제 미설정이어도 **핵심 플로**(로그인 → 워크스페이스 → 키 → ingest)가 README 한 블록으로 재현된다.

## 24시간 연속 루프 (Ralph 운영 규약)

목표는 “한 번에 다 끝내기”가 아니라 **같은 본질 축에 대한 반복**이다. 매 **에이전트 이터**는 현재 **역할**(기획·디자인·구현·테스트 중 하나; 루프가 순서대로 부여)에 맞게 아래를 **순서대로** 끝낸다. 직전 이터가 남긴 커밋·`.ralph/progress.md`를 먼저 **감시 요약**한다.

1. **읽기** — `RALPH_TASK.md`(미완 `[ ]` 중 우선순위 1개), `.ralph/guardrails.md`, `.ralph/progress.md`, `.ralph/errors.log`.
2. **하기** — 그 한 항목(또는 쪼갠 하위 한 덩어리)만 **현재 역할 범위 안에서** 구현·수정한다. 범위 밖 리팩터 금지.
3. **검증** — 루트 `npm run build` **+** 이번 변경에 해당하는 **실행 검증**(루트 `README.md` 스모크: `npm run dev`는 **3000 포트만** — 열려 있으면 `kill` 후 기동, OpenGraze API `curl`, `npm run platform:self-test` 등). 임의 포트로 서버를 여러 개 띄우지 않는다.
4. **기록** — **`git commit`**(스코프 단위로 자주), `.ralph/progress.md`에 “무엇을 왜 했는지” 한 단락, 해당 기준이 끝났으면 `RALPH_TASK.md`에서 `[x]`.
5. **검토** — 남은 `[ ]` 중 다음에 가장 본질에 가까운 것을 고른다(가짜 바쁨: 문서만 양산하지 않기).

**연속 실행(예: 24h)** — 터미널이 끊기지 않게 `tmux`/`screen` 등을 쓴다.

**이터 상한 없음(무한에 가깝게)** — `ralph-loop.sh`에 **`-n 0`** 또는 **`--infinite`** 를 쓰면, `RALPH_TASK.md` 체크가 전부 `[x]`이거나 GUTTER·직접 중단(Ctrl-C)할 때까지 이터를 이어 간다(내부적으로 큰 정수 상한). 장시간은 반드시 `tmux` 등에서 실행할 것.

```bash
# 상한만 크게 (고정 횟수)
export MAX_ITERATIONS=999
./.cursor/ralph-scripts/ralph-loop.sh -y

# 상한 없음 (권장: tmux 안에서)
./.cursor/ralph-scripts/ralph-loop.sh -y --infinite
# 동일: ./.cursor/ralph-scripts/ralph-loop.sh -y -n 0
```

장시간 루프에서는 **한 이터 = 한 명확한 체크 항목**이 되도록 `Success Criteria`를 잘게 쪼갠다.

### 비용과 “자동”

에이전트 루프는 **이터·모델·맥락 길이**에 비례해 비용(또는 플랜 쿼터)이 든다. **완전 자동(`--infinite`)은 예산 예측이 어렵다** — “자동이지만 한도 있는” 쪽을 기본으로 둔다.

- **이터 상한**: `--infinite` 대신 **`-n 1`~`-n 5`** 정도로 짧게 돌리고, `cron`/`launchd`로 **하루 몇 번만** 재실행하는 방식이 비용 통제에 유리하다.
- **모델**: 기본값은 Cursor **`auto`**(Cursor가 작업에 맞게 라우팅). 고정 모델은 `ralph-loop.sh -m …` 또는 **`RALPH_MODEL`** 로 덮어쓴다(`agent models` / [CLI parameters](https://cursor.com/docs/cli/reference/parameters) 참고).
- **범위**: 위의 “한 이터 = 한 체크”를 지키면, 같은 목표에 도달할 때 **총 토큰이 줄어든다**.
- **중단**: 예산 한도에 가까우면 루프를 끊고(`Ctrl-C`), 다음은 수동으로 우선순위 한 줄만 진행한다.

## Out of Scope (unless explicitly requested)

- 다른 회사 SaaS 전 기능 패리티(분석·퍼널·이메일 마케팅 등) 맹목적 추격.
- 앱 저장소의 **요청 없는** 대규모 리팩터.
- `install.sh` 파이프 비TTY 설치 — 스크립트는 `.cursor/ralph-scripts/`에 고정.

## Notes for the Agent

- **제품 목적**은 다중 에이전트 **역할별** 작업 모니터링이다. 텔레메트리·이벤트를 추가할 때 역할 메타를 빼먹지 말 것(`RALPH_TASK.md`의 규약 확정 후 일관 적용).
- **`ralph-loop.sh`**: 기본 `RALPH_ROLE_MODE=cycle`이면 이터마다 기획→디자인→구현→테스트가 순환하고, 프롬프트가 직전 역할 산출물 감시를 요구한다. 예전 단일 동작은 `RALPH_ROLE_MODE=mono`.
- Ralph upstream 개요·맥락 회전·git: [ralph-wiggum-cursor](https://github.com/agrimsingh/ralph-wiggum-cursor). 채팅만으로 작업을 끝내지 말고, **커밋 + 빌드 + 스모크**까지 한 사이클로 묶는다.
- Cursor CLI(에이전트): https://cursor.com/install — 설치 후 명령은 공식적으로 **`agent`**([CLI 설치](https://cursor.com/docs/cli/installation)). 레포 스크립트는 **`agent` 또는 예전 이름 `cursor-agent`** 중 PATH에 있는 것을 쓴다. `~/.local/bin`을 PATH에 넣고 `agent --version`으로 확인한다.
- 선택 UI: `brew install gum`
- 병렬 모드 사용 시 `RALPH_TASK.md`는 **반드시 커밋된 상태**여야 한다(upstream Ralph 제약).
- 결제 구현·질의 시: [LLMs로 결제 연동하기](https://docs.tosspayments.com/guides/v2/get-started/llms-guide), 문서 맥락 [llms.txt](https://docs.tosspayments.com/llms.txt), 필요 시 MCP(가이드 내 Cursor 절)로 v2 스펙을 조회한다.
- 로컬 서버 스모크 시 **포트 3000 고정**: `npm run dev`(선행 `kill:3000`). 테스트마다 `-p 3020` 등으로 포트를 늘리지 않는다(`scripts/kill-port.sh`).
