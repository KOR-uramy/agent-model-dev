# Ralph Task: OpenGraze (= Workspace Platform) / 관측 가능한 워크스페이스 플랫폼

## Goal (본질)

**앱의 목적은 다중 에이전트 작업 모니터링이다.** Ralph 루프 안에서 역할을 **기획(planning)·디자인(design)·구현(implementation)·테스트(test)** 로 나누고, 각 작업 단위가 남기는 로그·텔레메트리에는 **역할을 식별할 수 있는 헤더(메타)** 가 붙도록 규약·UI·스크립트를 맞춘다. 운영자는 한 화면에서 **어느 역할이 무엇을 했는지**를 시간순으로 재구성·검토할 수 있어야 한다.

그 위에서 **개발·에이전트 작업이 “어디서 무엇이 얼마나 일어났는지”**를 한곳에서 재현할 수 있게 한다. 추상적인 “플랫폼 완성”이 아니라, 아래 **측정 가능한 상태**에 계속 가까워지는 것이 목표다.

**성장 루프** — 체크리스트가 채워질수록 끝이 아니라, **기획이 잘 나가는 동종 앱**(워크스페이스·관측·과금 흐름이 비슷한 SaaS 등)과 비교해 **UI·UX·디자인·수익화·트래픽·마케팅** 관점에서 부족한 점을 찾아 **새 `[ ]` 항목**으로 이 문서에 계속 싣는다(비교 대상·날짜는 `.ralph/progress.md`에 한 줄이라도 남긴다).

1. **로컬·Ralph** — 루프는 `events.jsonl`·`workspace-telemetry.jsonl`에 쓰고, OpenGraze **`/`** 대시보드·`GET /api/ralph/events`는 **SQLite `TimelineEvent`**만 읽는다(동기화: `POST /api/ralph/sync-jsonl` 또는 `npm run sync:feed -w open-graze`). **역할 메타**는 이 파이프(JSONL → 동기화 → 타임라인·API)를 따라 끊기지 않게 전달하는 것을 목표로 한다.
2. **대외·SaaS(동일 앱)** — **Workspace Platform**(워크스페이스 플랫폼)과 **OpenGraze**는 **같은 앱**이다(과거 문맥의 `workspace-platform` 통합본). npm·디렉터리 워크스페이스 이름만 **`open-graze`**이며 코드는 전부 `apps/open-graze` 한 Next 앱에 있다. 그 안에서 **회원가입·DB 이메일·비밀번호 로그인**(Credentials·JWT), 워크스페이스, **워크스페이스 단위 작업 현황**(제목·설명·상태는 **API 연동으로 반영**하고 대시보드는 **조회 전용**), API 토큰, 수집·웹훅, (설정 시) **토스페이먼츠 v2** 결제·구독 경로가 있다. (Stripe 스캐폴드는 토스 전환 전 임시·참고용.)
3. **반복** — `ralph-loop.sh`는 기본 **역할 파이프**(기획→디자인→구현→테스트)로 이터를 돌린다. 각 이터는 직전 역할의 산출물(git·`.ralph/progress.md`)을 **감시**한 뒤 본 역할만 수행한다. 한 사이클 끝에는 루트 `npm run build` 등 검증·커밋·기준 `[x]`·`.ralph/progress.md` 요약이 이어진다. 단일 프롬프트만 쓰려면 `RALPH_ROLE_MODE=mono`를 본다.

**기획 원칙** — **기획(planning)** 은 위 **본질**(다중 에이전트·역할별 모니터링, 관측·신뢰·재현, 워크스페이스 플랫폼의 측정 가능한 Success)에서 출발한다. 유행·기능 나열·“완성도”를 위한 확장은 **본질에 직접 닿을 때만** 다루고, 닿지 않으면 **거절하거나 `RALPH_TASK.md`에 `[ ]`로 남길 가치**가 있는지 먼저 적는다. 동종 비교·성장 루프도 **같은 본질을 강화하는 갭**에 한정한다. **UI·UX 고민은 기본적으로 최후 단계**로 미루며, 초기 구현은 **기능을 먼저 한 페이지에 모아 작동시키는 것**을 우선한다. 한 페이지 안의 의미 있는 기능·조작 단위가 **10개 이상**이 되면 그때 **카테고리 기준으로 탭/추가 페이지로 분리**한다. UX는 **zero-click 지향**을 기본으로 두고, 키보드 입력은 **정말 피할 수 없는 부분만** 남긴다. 디자인(팔레트·폰트·간격·밀도·컴포넌트 톤)은 내부 감각에 기대기보다 **레퍼런스 카피 우선**으로 접근하고, 새 시각 언어를 임의로 발명하기보다 **잘 된 동종 제품/화면을 먼저 강하게 참조·복제한 뒤 필요한 차이만 조정**한다.

별도 앱 저장소(예: `llm_agent`) 변경은 **그 저장소에서 명시적으로 요청된 범위**에만 한정한다.

## Context

| 영역 | 위치 |
|------|------|
| Ralph 스크립트 | `.cursor/ralph-scripts/` — `ralph-loop.sh` 기본 **4역할 순환**(기획·디자인·구현·테스트) + 직전 단계 감시; **기획은 Goal 본질·기획 원칙 우선**. 순환 끄기: `RALPH_ROLE_MODE=mono` |
| OpenGraze / Workspace Platform | **동일 앱** — `apps/open-graze`(패키지名 `open-graze`). 별도 `workspace-platform` 앱은 없음. **타임라인·역할·수집 규약의 문서 단일 근거는 이 앱의 README·코드**로 둔다(제품 스코프 밖 패키지명은 요구사항 문장에 쓰지 않음). |
| SDK — 플랫폼 수집 라이브러리 | `packages/ralph-workspace-sdk` — **`createOpenGrazeIngestClient`**(`POST /api/v1/events`·`GET /api/v1/meta/limits`), **`summarizeIngestPayload`**, **`openGrazePlatformEnvSnippet`**. 다른 앱은 동일 패키지로 붙이고, 선택 서브패스 **`ralph-workspace-sdk/platform`**(동일 API, 번들 분리용). |
| 자기 연동 테스트 | 루트 `npm run platform:self-test` — `scripts/platform-self-test.mjs`, 루트 `.env.example`의 `OPENGRAZE_PLATFORM_*` · LLM/연동 장문 **`docs/opengraze-llms-guide.md`**, 짧은 인덱스 **`/llms.txt`** |
| 런타임 스모크(HTTP) | 루트 `npm run runtime:smoke` — `scripts/runtime-smoke.mjs`; 앱 기동 후 공개·타임라인 API·`llms.txt` 형상 검증(`RUNTIME_SMOKE_BASE_URL` 선택) |
| 결제 연동 규범 | 토스페이먼츠 v2 — [LLMs로 결제 연동하기](https://docs.tosspayments.com/guides/v2/get-started/llms-guide), AI/에이전트용 문서 인덱스 [llms.txt](https://docs.tosspayments.com/llms.txt) |
| 루프 상태 | 로컬 `.ralph/progress.md`·`.ralph/errors.log`(git 제외), 공유 Signs 는 `docs/ralph-guardrails.md`(추적) |
| 모델 공통 로그 위치 | `cursor`, `codex` 등 **어떤 모델/CLI를 써도** Ralph 실행 기록은 같은 워크스페이스의 **`.ralph/activity.log`**(사람용 모니터)와 **`.ralph/events.jsonl`**(구조화 이벤트)로 모은다. 모델별 별도 로그 파일을 만들지 않는다. |
| 에이전트·모델 선택 근거 | `docs/agent-model-selection.md` |
| 역할별 모니터링 규약 | 이벤트·텔레메트리 `detail.role` 등 — 아래 Success **역할별 다중 에이전트** 절(구현 완료) |
| 회원가입·작업 현황 | `/register`, `POST /api/auth/register`, 워크스페이스 `WorkspaceTask` **API로 반영·갱신**, 대시보드는 **조회** — 아래 Success **제품 (OpenGraze 내 SaaS)** 절 |
| 이벤트 파이프라인 기준 구조 | **데이터 생성부 → 수집 레이어 → 정규화 레이어 → 전달 레이어 → 구독 관리 레이어 → 클라이언트 수신 레이어 → 표시/상태 레이어**. 센서·서버 이벤트·DB 변경·외부 API에서 시작해, Webhook/Polling/MQTT/내부 Event로 수집하고, 공통 메시지 포맷(`timestamp`, `source`, `type`, `payload`)으로 정규화한 뒤 SSE/WebSocket/MQTT/Push로 전달한다. 구독 관리에서는 topic/room/channel·권한·필터를 관리하고, 최종적으로 브라우저/앱/대시보드/로봇 UI에서 받아 화면 반영·캐시 갱신·알림 표시로 이어진다. |
| 병렬 루프 캐시 | `.ralph/tasks.yaml` — `RALPH_TASK.md`에서 자동 생성(`task-parser.sh`). 내용이 옛날이면 캐시 삭제 후 `parse_tasks` 또는 루프 1회로 재생성 |

연속 작업은 `ralph-loop.sh`(또는 `ralph-setup.sh`) + `cursor-agent`. **기준은 항상 이 파일**이며, 코드가 앞서가면 **먼저 여기를 고친 뒤** 구현한다.

## 요청·스펙 기록 (대화에서 합의한 내용 — Success와 함께 유지)

아래는 채팅에서 정리된 **제품·루프 요구**를 한곳에 모은 것이다. 구현 상태는 **Success 체크박스**와 코드가 진실이며, 이 절은 “무엇을 달라고 했는지”가 문서에 남도록 한다.

- **인증** — Google OAuth 대신 **DB 이메일·비밀번호(Credentials·JWT)**. 로컬 시드 계정·`POST /api/auth/register` **회원가입**으로 신규 계정.
- **앱 정체** — **OpenGraze = Workspace Platform** 동일 앱; 코드 경로는 **`apps/open-graze`**(패키지名 `open-graze`)뿐, 별도 `workspace-platform` 앱 없음.
- **Ralph 루프 역할** — 이터마다 **기획 → 디자인 → 구현 → 테스트** 순환(`RALPH_ROLE_MODE=cycle` 기본). 각 이터는 **직전 역할 산출물을 감시**한 뒤 본 역할만 수행(`ralph-common.sh` 프롬프트). 단일 프롬프트만 쓸 때는 `RALPH_ROLE_MODE=mono`.
- **모델 공통 기록 경로** — `cursor`, `codex` 등 어떤 실행기/모델을 쓰더라도 **동일 워크스페이스의 `.ralph/activity.log`와 `.ralph/events.jsonl`** 에 기록한다. 운영 모니터·플랫폼 export는 이 **공통 경로**를 기준으로 붙인다.
- **기획** — Goal **본질**·Success **북극성**에 맞춰 범위·우선순위·수용 힌트를 세운다. 본질과 무관한 기능·유행안은 **차단**하거나, 정말 필요하면 **본질과의 연결 한 줄**을 적은 뒤에만 `RALPH_TASK.md`에 `[ ]` 후보로 올린다.
- **UI/UX 정책** — UI·UX 다듬기는 **기능·데이터 흐름이 먼저 선 뒤 최후에** 한다. 기본 구현은 **관련 기능을 한 페이지에 모두 나열**하는 방식으로 시작하고, 한 페이지의 기능·조작 단위가 **10개 이상**이 되면 그때 **카테고리별 탭 또는 추가 페이지**로 옮긴다. UX는 **zero-click**을 지향하며, 사용자가 키보드를 치지 않고도 흐름을 진행할 수 있는 선택·자동 채움·버튼 중심 인터랙션을 우선한다. 텍스트 입력은 불가피한 식별자·본문 입력 같은 경우에만 둔다.
- **디자인 정책** — 팔레트·폰트·간격·밀도·카드/테이블/버튼 스타일은 “감으로 새로 정하기”보다 **레퍼런스 카피를 우선**한다. 디자인 역할은 먼저 **좋은 동종 SaaS 화면 1~3개**를 기준으로 삼아 레이아웃·타이포·색·간격을 최대한 비슷하게 재현하고, 그다음 현재 제품의 본질과 충돌하는 부분만 조정한다. “독창성”은 1순위가 아니며, **신뢰 가능한 레퍼런스를 빠르게 복제해 일관성을 확보하는 것**을 우선한다.
- **플랫폼 작업 추적** — 워크스페이스 안 **`WorkspaceTask`**(제목·설명·`status`: backlog \| todo \| in_progress \| blocked \| done). **생성·상태 변경은 API**(`POST/PATCH …/api/workspaces/[slug]/tasks` 등, 멤버 세션)로 하고, **대시보드 `/dashboard/[slug]`는 표시만** 한다. 같은 화면 **작업 현황** 블록에는 공식 Task 표 외에 **`POST /api/v1/events` 수집 줄 요약**(시각·kind·data 요약)을 함께 두어, self-test·연동으로 들어온 활동이 위에서부터 이어져 보이게 한다(자동 새로고침은 레이트 한도를 고려해 완만하게). 시드: 워크스페이스 slug 기본 `opengraze-monitoring`, 샘플 작업 1건(제목·설명은 시드 스크립트 기본값) 등.
- **SDK로 타 앱 연동** — OpenGraze(호스팅)에 붙이는 **수집·한도 조회**는 `ralph-workspace-sdk`의 **`createOpenGrazeIngestClient`** 등으로 재사용한다. OpenGraze UI에서도 동일 SDK의 **`summarizeIngestPayload`** 로 수집 요약 규칙을 한곳에 둔다(다른 레포·마이크로서비스가 같은 규칙으로 대시보드를 맞출 수 있음).
- **이벤트 파이프라인 계층** — OpenGraze의 이벤트 흐름은 아래 **7개 레이어**를 기준 구조로 본다. ① **데이터 생성부**: 센서, 서버 이벤트, DB 변경, 외부 API. ② **수집 레이어**: Webhook, Polling, MQTT, 내부 Event. ③ **정규화 레이어**: 공통 메시지 포맷으로 변환하고 `timestamp`, `source`, `type`, `payload`를 정리. ④ **전달 레이어**: SSE, WebSocket, MQTT, Push. ⑤ **구독 관리 레이어**: 누가 어떤 topic/room/channel을 받는지, 권한 체크와 필터링을 관리. ⑥ **클라이언트 수신 레이어**: 브라우저, 앱, 대시보드, 로봇 UI. ⑦ **표시/상태 레이어**: 화면 반영, 캐시 갱신, 알림 표시. 이후 기획·디자인·구현·테스트는 각 변경이 어느 레이어 책임인지 문서·코드에서 함께 드러나야 한다.
- **역할 메타(타임라인)** — JSON `detail` 객체에 선택 **`role`**(문서상 `detail.role`), 값은 `planning` \| `design` \| `implementation` \| `test`; `/` 타임라인·`stream-parser` `session_start`와 정합.
- **`ralph-loop.sh` 표시** — 시작 시 `RALPH_TASK.md` **앞 55줄** 요약. `Progress`는 파일 안 **목록 체크박스**만 집계. **`--parallel` / `--max-parallel`** 은 **미완 `[ ]`가 있을 때** `ralph-parallel.sh`로 에이전트를 띄운다. **한 배치 후 전부 `[x]`**이면: **무한(`--infinite` / `-n 0`)이 아닐 때는 종료**가 맞고, **`--infinite`와 함께 쓰면** 성장 루프로 **기획(planning) 1회**를 돌려 새 `- [ ]`를 추가한 뒤 **병렬을 다시** 돈다.
- **체크가 가득 찬 뒤** — Success 목록이 **모두 `[x]`**가 되면, 그 세션(또는 다음 이터 시작 전)에 **동종 앱 대비 갭 검토**를 하고 아래 **「성장·동종 비교」** 축에서 **새 `[ ]`를 최소 1개 이상** 추가한 뒤에만 “스프린트 종료”로 본다. 빈 완료 상태로 루프를 멈추지 않는다.
- **성장 루프(비교 축)** — Goal의 **성장 루프** 문단과 Success **「성장·동종 비교」**·메타 **동종 비교 → 체크 확장**을 따른다(UI·UX·디자인·수익화·트래픽·마케팅).

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
- [x] **동종 비교 → 체크 확장** — 기획·제품 수준이 안정적인 **비교 SaaS 1~3개**를 정하고(이름·URL·선정 이유를 `.ralph/progress.md`에 기록), **UI / UX / 디자인 / 수익화 / 트래픽·운영 / 마케팅** 각각에서 **우리가 부족한 점**을 bullet로 적은 뒤, 그중 **우선순위 높은 것부터 측정 가능한 `- [ ]` 항목**으로 본 문서 **「성장·동종 비교」** 절(또는 해당 제품 절)에 추가한다. 전부 `[x]`만 남은 상태가 되면 **이 절을 먼저 다시 채운다**.

### 신뢰·보안 (본질)

- [x] 비밀(API 키, OAuth, 토스·Stripe 키, DB URL)은 **저장소에 커밋하지 않는다** (`.env.example`만).
- [x] 수집 API(`POST /api/v1/events`)에 **남용 완화** 한 가지 이상(예: 레이트 리밋, body 크기 제한, 또는 문서화된 운영 가이드).

### 재현·품질

- [x] 루트에서 `npm run build`가 **루트 `package.json`이 빌드하도록 둔 workspaces** 전부 통과한다.
- [x] `open-graze`는 배포용 `next build`(webpack)로 검증한다(Turbopack 전용 `/_not-found` 수집 버그 회피). 개발 시 `GET /api/ralph/events`는 **실행 스모크**(200·JSON)로 확인한다 — 빌드만으로는 Turbopack+CJS 번들 이슈를 잡지 못한다.
- [x] **런타임 스모크(자동)** — 루트 `npm run runtime:smoke`가 기동 중인 OpenGraze(기본 `http://127.0.0.1:3000`; 덮어쓰기: `RUNTIME_SMOKE_BASE_URL` 또는 `OPENGRAZE_PLATFORM_URL`)에 대해 `GET /api/v1/meta/limits`, `GET /api/ralph/events`(및 `role=planning`), `GET /api/ralph/events/range`, `GET /llms.txt`를 호출해 **HTTP 200·JSON(또는 텍스트) 형상**을 검증한다. 서버가 없으면 **한 줄 안내**로 종료한다. 에이전트 이터의 **실행 검증** 단계에 `npm run build`와 함께 넣을 것을 권장한다(`scripts/runtime-smoke.mjs`).
- [x] 에이전트/모델 **선택 근거**(프로바이더·버전·제약·측정)가 `docs/` 또는 루트 마크다운 **한 파일**에 요약되어 있다(추측만으로 적지 않는다).

### 제품 (로컬 Ralph + OpenGraze)

- [x] `stream-parser`가 구조화 JSONL을 남기고, SDK가 이를 읽어 대시보드에 합친다(Ralph + 앱 텔레메트리).
- [x] Git `post-commit` 등 **콜백 경로**로 텔레메트리를 쌓을 수 있다(`openg-graze-git-commit` CLI).
- [x] **한 앱 안 역할** — `/`·`GET /api/ralph/events`는 SQLite `TimelineEvent`(JSONL은 동기화로 적재); `/login`·`/dashboard`·`/api/v1/events` 등은 워크스페이스·수집 테이블(`apps/open-graze/README.md`).

### 역할별 다중 에이전트 모니터링 (제품 북극성 — 구현은 단계적으로)

역할 집합(1차): **기획 · 디자인 · 구현 · 테스트**. 저장 시 권장 키: `planning` | `design` | `implementation` | `test`(UI 표기는 한글 가능). 확장 시 이 문서와 **앱 내 타입·주석**을 함께 갱신한다.

**역할 필드(고정, 2026-05 디자인)** — 타임라인 한 행(`WorkspaceFeedEvent` / `TimelineEvent.payload` JSON)에서 `detail`이 객체일 때 **선택** 필드 **`role`**을 둔다. 문서·코드 주석에서는 이를 **`detail.role`**이라 부른다(JSON 키 이름은 `role`이며 `detail.role`이라는 단일 키를 쓰지 않는다). 값은 위 권장 키 네 가지 중 하나만 허용. 생략·알 수 없음이면 소비 UI는 `—`(무배지). `stream-parser`의 `session_start`는 `RALPH_ROLE`이 있을 때만 `detail`에 `role`을 넣는다(`RALPH_ROLE_MODE=mono` 등으로 역할 없으면 생략). `source: application` 텔레메트리도 동일 규칙으로 `detail.role` **선택**. 워크스페이스 **`POST /api/v1/events`** 본문에 역할을 실을 경우 동일 `detail.role` 관례를 **권장**(이번 북극성 UI는 **`/` 타임라인**만).

- [x] **규약** — `apps/open-graze/README.md` 및 해당 앱 내 타임라인·수집 관련 코드에, **역할 필드 위치·형식**(예: `detail.role` 또는 동등)이 한 줄로 고정되어 있다.
- [x] **생산 경로(루프)** — `ralph-loop`/`ralph-once`가 이터마다 역할을 순환하고, `stream-parser`의 `session_start` 이벤트 `detail.role`에 `planning` \| `design` \| `implementation` \| `test`가 기록된다(`RALPH_ROLE_MODE=mono`일 때는 생략).
- [x] **소비 UI** — OpenGraze **`/`** 타임라인(및 관련 API 응답)에서 역할이 **헤더·배지 등으로 구분**되어, 같은 시간축에서 역할별 스캔이 가능하다.

### 제품 (OpenGraze 내 SaaS·수집)

- [x] **회원가입**(공개 `/register` + `POST /api/auth/register`)으로 이메일·비밀번호 계정을 만들 수 있다(중복 이메일 거절, 비밀번호 bcrypt).
- [x] **워크스페이스 작업 현황** — `WorkspaceTask`(제목·설명·`status`: backlog·todo·in_progress·blocked·done)를 **API**로 생성·갱신·조회할 수 있고, 워크스페이스 **대시보드는 조회 전용**으로 한눈에 본다(폼으로 수동 등록하지 않음). `/dashboard/[slug]` **작업 현황** 섹션에는 공식 Task 표와 함께 **수집 이벤트 요약 표**(동일 `GET …/events` 데이터)를 두어 `platform:self-test` 등으로 쌓인 줄이 상단에서도 보이게 한다. 로컬 시드는 테스트 워크스페이스에 **샘플 작업 1건**을 넣는다.
- [x] **플랫폼 수집 SDK** — `ralph-workspace-sdk`에 **`createOpenGrazeIngestClient`**·**`summarizeIngestPayload`**·**`openGrazePlatformEnvSnippet`**(및 exports **`ralph-workspace-sdk/platform`**)로 타 레포·서비스가 동일 수집·meta/limits 계약에 붙을 수 있다. OpenGraze 대시보드는 수집 요약에 SDK의 `summarizeIngestPayload`를 사용한다.
- [x] 이메일·비밀번호(DB) 로그인, 워크스페이스, API 키 발급이 동작 가능한 형태로 존재한다.
- [x] **결제**는 [토스페이먼츠 LLMs 연동 가이드](https://docs.tosspayments.com/guides/v2/get-started/llms-guide) 및 [llms.txt](https://docs.tosspayments.com/llms.txt)를 따른다(결제위젯 v2·승인 API·웹훅 등). Cursor 연동 시 가이드에 안내된 **토스페이먼츠 MCP** 활용을 우선한다.
- [x] 레거시 **Stripe** Checkout/Webhook 스캐폴드는 코드에 남아 있으나, 제품 기준 결제 수단은 아니다(토스 연동 후 정리).
- [x] **텔레그램** — (로컬/SDK) `TELEGRAM_BOT_TOKEN`·`TELEGRAM_CHAT_ID`·선택 `TELEGRAM_NOTIFY_COMMITS=1`로 커밋 등 알림 가능. (클라우드) `POST /api/webhooks/telegram` + `TELEGRAM_WEBHOOK_SECRET` + `TELEGRAM_CHAT_WORKSPACE_MAP`으로 채팅 메시지·`/task 본문`을 `IngestedEvent`로 수집해 관측·작업 전달 파이프가 있다.
- [x] **자기 연동(dogfood)** — 플랫폼을 켠 뒤 대시보드에서 워크스페이스(예: `open-graze-self`)·API 키를 발급하고, **이 레포**에서 `OPENGRAZE_PLATFORM_API_KEY` 등을 두고 `npm run platform:self-test`를 실행하면 `POST /api/v1/events`로 `opengraze.self_test`가 들어가며, 같은 워크스페이스 대시보드 **이벤트** 목록에서 확인할 수 있다.
- [x] 프로덕션 배포 시 **Postgres** 전환 경로가 문서에 적혀 있다(SQLite 개발 전제 명시).
- [x] 결제 미설정이어도 **핵심 플로**(로그인 → 워크스페이스 → 키 → ingest)가 README 한 블록으로 재현된다.

### 성장·동종 비교 (UI / UX / 디자인 / 수익화 / 트래픽 / 마케팅 — 반복 축)

아래는 **비교 앱 대비 갭**을 제품에 반영하기 위한 **살아 있는 체크**다. 구현이 끝나면 `[x]`로 두되, **전부 `[x]`가 되면** 메타의 **「동종 비교 → 체크 확장」**에 따라 새 `[ ]`를 또 붙인다.

- [x] **UI** — `/`, `/login`, `/register`, `/dashboard`, 워크스페이스 상세 등 **핵심 화면**을 동종 SaaS와 나란히 두고 레이아웃·밀도·일관성 갭을 적은 뒤, **재현 가능한 개선**을 `- [ ]` 하위 항목으로 쪼갠다.
- [x] **UX** — 오류·빈 상태·로딩·폼 검증·성공/실패 피드백·뒤로가기 등 **마찰 지점**을 시나리오로 적고, 완화 과제를 `- [ ]`로 추가한다.
- [x] **디자인** — 타이포·색·간격·컴포넌트 중복을 점검하고, **브랜드/디자인 토큰** 정리 또는 시각 계층 개선을 `- [ ]`로 추가한다.
- [x] **수익화** — 플랜·가격·결제 실패·청구·환불·무료 체험 문구가 **UI·README·`.env.example` 주석**과 맞는지 동종 대비 검토하고 갭을 `- [ ]`로 추가한다.
- [x] **트래픽·운영** — 수집 API·대시보드에 대한 **남용 방어·관측·알림**(레이트, 로그, 쿼터 안내 등)을 동종 대비 `[ ]`로 추가한다.
- [x] **마케팅** — 첫 방문자에게 **가치 제안·신뢰·전환**(CTA, 사회적 증거, 문서 링크)이 경쟁 대비 충분한지 검토하고 랜딩·README·인앱 카피 개선을 `- [ ]`로 추가한다.

**성장 루프 확장 (병렬 스윕 직후 · 2026-05-03)** — 상위 축은 유지한 채, **동종 2종** 대비로 관측·재구성 갭을 측정 가능한 하위 항목으로 분해한다. *(본질: 같은 시간축에서 역할·세션 단위로 “무엇이 있었는지”를 빠르게 재구성·감사할 수 있어야 한다.)*

- **동종(참고)** — [Langfuse](https://langfuse.com)(에이전트/LLM **세션·태그·필터**로 트레이스 드릴다운), [Linear](https://linear.app)(워크스페이스 **이슈 보드·필터·키보드**로 상태 스캔). 우리는 Ralph JSONL→SQLite·`/` 타임라인 중심이라 **서버 쿼리 필터·UI 동기화·보내기**가 상대적으로 얇다.

- [x] **API — 역할 필터** — `GET /api/ralph/events`가 쿼리 `role=planning|design|implementation|test` 중 하나일 때 해당 `detail.role`만 반환(또는 동일 의미의 단일 필터 파라미터)하고, `apps/open-graze/README.md`에 **검증용 `curl` 한 줄**(필터 유·무 응답 건수 비교 가능)이 있다.
- [x] **UI — 역할 필터 연동** — `/` 타임라인이 위 API와 동일한 `role` 값으로 연동(셀렉트·토글 등)되고, 선택 시 테이블이 갱신되어 **한 역할만** 시간순 스캔할 수 있다.
- [x] **재현·감사 — 기간보내기** — 동기화된 Ralph/SQLite 타임라인을 `from`·`to`(ISO 8601) 범위로 **JSON 배열**을 반환하는 `GET` 라우트 또는 루트 스크립트 1개가 있고, README에 **포함 필드 표**(최소: 시각, 유형, `detail.role`, `sessionId` 또는 동등 식별자)가 있어 운영자가 동일 피드를 파일로 재현·공유할 수 있다.

**성장 루프 확장 (Ralph 사이클 2 · 2026-05-03 병합 직후 기획)** — `role`/기간까지 갖춘 뒤 다음 층은 **딥링크·세션 스코프·수집 경로 신호**다. *(본질: 운영자가 URL·스크립트만으로 동일 뷰를 복원하고, 세션 단위로 감사·장애 분석을 이어갈 수 있어야 한다.)*

- **동종(참고)** — [Axiom](https://axiom.co)(저장 쿼리·공유 URL), [Honeycomb](https://www.honeycomb.io)(필드 스코프·트레이스 딥링크). 우리 타임라인은 **주소줄 상태·세션 전용 뷰·ingest 거절 신호**가 아직 얇다.

- [x] **URL·재현 — 쿼리 동기화** — `/`의 `role` 선택(및 API와 동일 의미 파라미터)이 **브라우저 주소 `?role=`** 와 양방향 동기화되고, `apps/open-graze/README.md`에 **복사 가능한 예시 URL 한 줄**(역할 1개 고정)이 있다.
- [x] **API·UI — 세션 스코프** — `GET /api/ralph/events`에 **`sessionId=<string>`** 단일 필터(해당 세션 행만)가 있으며, `/`에서 세션 식별자를 입력하거나 목록에서 고르면 위 API와 동일하게 **한 세션만** 시간순 스캔할 수 있다.
- [x] **운영 가시화 — 수집 한도 신호** — `POST /api/v1/events`(또는 동일 레이트 정책 경로)가 한도 초과 시 **`Retry-After` 헤더** 또는 **JSON 오류 본문**에 재시도 가능 시각·기계 판독 가능한 코드를 포함하고, README에 **curl 한 줄**로 그 응답을 확인하는 절차가 있다.

**성장 루프 확장 (Ralph 사이클 3 · 2026-05-03)** — `?role=`까지 맞춘 뒤 **세션·보내기 URL**이 아직 한 덩어리로 공유되지 않고, `range`는 기간만큼 잘라줄 뿐 **같은 필터 언어**가 아니다. *(본질: 운영자가 링크·스크립트만으로 “누가·어느 세션·어느 채널·어느 구간”인지 동일 뷰·동일 파일로 재현·감사할 수 있어야 한다.)*

- **동종(참고)** — [Grafana](https://grafana.com)(대시보드 **변수·공유 URL**로 동일 대시보드 상태 복원), [Datadog Log Explorer](https://www.datadoghq.com/product/log-management)(**facet 조합**으로 채널·세션 유사 축을 한 쿼리에 묶음). 우리는 SQLite 타임라인이라 **주소줄에 `sessionId`·보내기 API에 동일 쿼리 축**을 맞추는 편이 유리하다.

- [x] **URL·재현 — `sessionId` 쿼리 동기화** — `/`의 세션 입력·선택 상태가 **`?sessionId=`** 와 **양방향** 동기화되고(빈 문자열은 키 제거), `?role=` 과 **동시에** 붙여도 충돌 없이 API와 같은 의미로 동작한다. `apps/open-graze/README.md`에 **`?role=` + `?sessionId=` 를 모두 고정한 복사 가능한 예시 URL 한 줄**이 있다.
- [x] **API·감사 — `range`에 `role`·`sessionId`** — `GET /api/ralph/events/range`가 `from`·`to` 외에 선택 쿼리 **`role`**, **`sessionId`(정확 일치)** 를 지원하고, `GET /api/ralph/events`와 **동일한 허용값·400 규칙**을 적용한다. README에 **필터를 넣은 `curl` 한 줄**과 파라미터 의미 표(최소: `from`·`to`·`role`·`sessionId`·상한)가 있다.
- [x] **운영 — range 상한·잘림 신호** — `events/range` 응답이 행 상한에 도달하면 **JSON 최상위**에 기계 판독 가능한 필드(예: `truncated: true`, `returnedCount`)를 포함하거나 **413** 등으로 거절하는 규칙을 **한 가지로 고정**하고, README에 그 응답을 확인하는 **절차 한 줄**이 있다.

**성장 루프 확장 (Ralph 사이클 4 · 2026-05-03 병렬 스윕 직후 기획)** — `?role=`·`?sessionId=`·`range` 필터는 맞췄지만 **홈 타임라인의 절대 시간 구간**이 주소줄에 없어 “같은 순간의 같은 표”를 URL만으로 완전히 복원하기 어렵고, 피드 **`source`(랄프 vs 앱 등 채널)** 를 API·UI에서 한 축으로 거르는 기능이 없다. *(본질: 운영자가 링크·스크립트만으로 **동일 시간·동일 채널·동일 역할·동일 세션** 뷰를 재현·감사할 수 있어야 한다.)*

- **동종(참고)** — [Grafana Explore](https://grafana.com/docs/grafana/latest/explore/)(URL에 **절대 시간 범위**가 들어가 동일 탐색 상태 복원), [Sentry Discover](https://docs.sentry.io/product/discover-queries/)(**환경·release** 등 축 필터로 채널 유사 신호 분리). 우리는 SQLite 타임라인이므로 **`from`/`to`를 홈 URL에 올리고** `source`를 목록·range와 같은 쿼리 언어로 통일하는 편이 유리하다.

- [ ] **URL·재현 — `from`·`to` 쿼리 동기화** — `/`에서 사용자가 고른 **절대 시간 구간**이 **`?from=`·`?to=`**(ISO 8601; timezone 포함)와 **양방향** 동기화된다. 규칙을 고정한다: (1) `from`/`to` 중 **하나만** 있으면 **둘 다 무효**(UI는 주소줄에서 키 제거, API는 400), (2) 둘 다 있을 때 UI는 값을 파싱해 **정규화된 ISO(UTC `Z`)** 로 주소줄을 다시 써 **동일 URL 재현**이 가능하게 한다, (3) 이 구간은 `role`·`sessionId`·`source`와 **AND 조합**이며 `tail`은 “모드”가 아니라 **구간 내 최대 행 수 상한**으로만 동작한다.
  - **계약(디자인 역할) 보강**: (a) `from`/`to`는 **timezone 포함**(예: `Z` 또는 `+09:00`)만 유효로 취급하고, timezone 없는 값은 **미지 값과 동일하게** 다룬다(재현성 확보; JS `Date.parse`의 로컬 해석 차이를 막는다), (b) `from > to`인 경우는 **API 400**(UI는 키 제거로 “필터 해제”), (c) `from`/`to`가 있는 경우에도 `tail`은 **추가적인 상한**으로만 동작한다(“최근 N개 모드”로 의미가 바뀌지 않음), (d) 주소줄 입력은 **URL 디코딩 후** 파싱하고, UI가 주소줄에 재기록할 때는 항상 **정규화된 `Z`** 를 쓴다(공유 안정성), (e) 주소줄 반영은 “입력 중”이 아니라 **필터 적용 시점**(적용 버튼/확정 이벤트 등)으로 고정하고, 기본은 `replaceState`로 **히스토리 스팸을 만들지 않는다**(공유·감사: 같은 URL을 안정적으로 유지).
  - **리스크(기획)**: `+09:00` 같은 timezone 표기는 URL에서 `+`가 공백으로 해석될 수 있으므로(폼 인코딩), UI는 **정규화된 `Z`로 재기록**을 기본으로 하고(복사·공유 안정), `from`/`to` 입력을 주소줄로 반영할 때는 반드시 **퍼센트 인코딩**(예: `+` → `%2B`)을 전제로 한다.
  - **검증 힌트(테스트 역할)**: 같은 URL을 새 탭/시크릿 창에 붙여넣었을 때 주소창의 `from`·`to`가 **정규화된 `Z`** 로 유지되고, 필터 UI와 응답 행이 원본 탭과 일치한다. (1) `?from=<유효>&to=<유효>` → 응답 200 + 주소줄 `Z` 정규화, (2) `?from=<유효>&to=`/`?from=` 단독/`?to=` 단독 → API 400 + UI에서 두 키 제거, (3) `?from=<유효>&to=<더 과거>`(from>to) → API 400. `apps/open-graze/README.md`에 **`?role=`·`?sessionId=`·`?from=`·`?to=` 를 모두 고정한 복사 가능한 예시 URL 한 줄**이 있다.
- [ ] **API·UI — `source` 필터** — `GET /api/ralph/events`와 `GET /api/ralph/events/range`에 선택 쿼리 **`source`**가 있으며, 허용값 집합은 타임라인 페이로드의 `source`와 **동일**하게 “한 곳”에서 고정한다(예: `ralph` \| `application`). **계약(디자인 역할)**: (1) `source`는 **대소문자 구분** 문자열로 취급(정규화 없음), (2) `source=`(빈 문자열)·미지 값은 **API 400**, (3) UI는 미지 값 감지 시 **주소줄에서 `source` 키 제거**로 “필터 해제”를 일관되게 수행한다, (4) 허용값 목록은 UI·API가 함께 import하는 단일 상수/타입에 고정(“한 곳”).
  - **계약(디자인 역할) 보강**: (a) `source`는 `role`·`sessionId`·`from/to`와 **항상 AND 조합**이다(“최근 N개” 등 의미 변경 없음), (b) UI는 “전체(필터 없음)” + 허용값 단일 선택(또는 토글)만 제공한다(복잡한 멀티셀렉트는 본질에 불필요), (c) 허용값 옵션은 `apps/open-graze/lib/timeline-query-params.ts`의 단일 키 목록(예: `EVENT_SOURCE_KEYS`)에서 **직접 생성**하고, 라벨만 별도 맵으로 둔다(문자열 산재 금지).
  - **리스크(기획)**: `source`는 운영자가 “랄프/앱/웹훅” 등 **수집 경로를 분리해 재현**하려는 축이다. 따라서 UI는 단순해야 하고, 미지 값/빈 값이 들어온 경우에는 “조용히 다른 결과”를 만들기보다 **필터 해제(주소줄 키 제거)로 수렴**해 신뢰를 지킨다.
  - **검증 힌트(테스트 역할)**: 동일 `tail`(또는 동일 `from`/`to`)에서 `source` 유·무의 `returnedCount/events.length`가 달라짐을 README의 **`curl` 한 줄**로 확인한다. 미지 값/빈 값은 API 400이며, UI는 주소줄에서 `source`를 제거해 “필터 해제”로 수렴해야 한다.
- [ ] **운영·감사 — “현재 뷰 복사”** — `/`에 **현재 적용 중인 `role`·`sessionId`·`from`·`to`·`source`(적용 시)** 를 모두 담은 **절대 URL**을 클립보드로 복사하는 컨트롤(버튼 등)이 있다(적용되지 않은 축은 쿼리 키를 포함하지 않음). **계약(디자인 역할)**: (1) 복사 URL은 화면이 이미 수행한 **정규화 결과**(예: `from`/`to`는 `Z`)를 그대로 담는다, (2) `role`·`sessionId`·`source`는 “현재 UI에 적용 중”인 경우에만 포함(빈 문자열·미지 값은 포함 금지), (3) base는 **현재 origin + pathname(`/`)** 이며 hash는 포함하지 않는다.
  - **계약(디자인 역할) 보강**: 컨트롤은 필터 영역의 “상태/감사” 행동으로 배치하고(한눈에 찾기), 클릭 시 사용자에게 **명시적 피드백(복사 성공/실패)** 가 있다(토스트/문구 등, 구현 방식은 자유). **실패 시에도** 최소 1회는 “복사 실패(권한/HTTPS/브라우저 제한)” 같은 문구가 보여야 한다(조용히 무시 금지).
  - **리스크(기획)**: 클립보드 API는 HTTP/권한/브라우저 정책에 따라 실패할 수 있으므로, 최소한 “복사할 URL”을 **사용자가 눈으로 확인할 수 있는 표면**(예: 읽기 전용 텍스트)으로도 제공하는 설계를 고려한다(신뢰·감사: 실패를 숨기지 않기).
  - **검증 힌트(테스트 역할)**: 복사 → 시크릿 창 붙여넣기 후, 주소창 쿼리와 필터 UI가 원본 탭과 동일해야 한다(README에 검증 절차 **한 줄**이 있다). 클립보드가 실패한 경우에도 사용자가 URL을 확인/복사할 수 있는 표면(읽기 전용 텍스트 등)이 있어야 하며, 실패가 “조용히” 지나가지 않아야 한다.

## 24시간 연속 루프 (Ralph 운영 규약)

목표는 “한 번에 다 끝내기”가 아니라 **같은 본질 축에 대한 반복**이다. 매 **에이전트 이터**는 현재 **역할**(기획·디자인·구현·테스트 중 하나; 루프가 순서대로 부여)에 맞게 아래를 **순서대로** 끝낸다. 직전 이터가 남긴 커밋·`.ralph/progress.md`를 먼저 **감시 요약**한다.

1. **읽기** — `RALPH_TASK.md`(미완 `[ ]` 중 우선순위 1개; **기획** 이터면 Goal **본질**·**기획 원칙**에 어긋나지 않는지 먼저 본다), `docs/ralph-guardrails.md`, `.ralph/progress.md`, `.ralph/errors.log`.
2. **하기** — 그 한 항목(또는 쪼갠 하위 한 덩어리)만 **현재 역할 범위 안에서** 구현·수정한다. 범위 밖 리팩터 금지.
3. **검증** — 루트 `npm run build` **+** `npm run runtime:smoke`(앱이 **이미** `npm run dev`로 떠 있을 때; Turbopack·API 런타임 오류 조기 발견) **+** 이번 변경에 해당하는 **실행 검증**(루트 `README.md` 스모크: `npm run dev`는 **3000 포트만** — 열려 있으면 `kill` 후 기동, OpenGraze API `curl`, `npm run platform:self-test` 등). 임의 포트로 서버를 여러 개 띄우지 않는다.
4. **기록** — **`git commit`**(스코프 단위로 자주), `.ralph/progress.md`에 “무엇을 왜 했는지” 한 단락, 해당 기준이 끝났으면 `RALPH_TASK.md`에서 `[x]`.
5. **검토** — 남은 `[ ]` 중 다음에 가장 본질에 가까운 것을 고른다(가짜 바쁨: 문서만 양산하지 않기). Success가 **전부 `[x]`**이면 **동종 비교**로 **「성장·동종 비교」**에 새 `[ ]`를 붙인 뒤 다음 이터로 넘어간다.

**연속 실행(예: 24h)** — 터미널이 끊기지 않게 `tmux`/`screen` 등을 쓴다.

**이터 상한 없음(무한에 가깝게)** — `ralph-loop.sh`에 **`-n 0`** 또는 **`--infinite`** 를 쓰면, `RALPH_TASK.md` 체크가 전부 `[x]`이거나 GUTTER·직접 중단(Ctrl-C)할 때까지 이터를 이어 간다(내부적으로 큰 정수 상한). 장시간은 반드시 `tmux` 등에서 실행할 것.

```bash
# 상한만 크게 (고정 횟수)
export MAX_ITERATIONS=999
./.cursor/ralph-scripts/ralph-loop.sh -y

# 상한 없음 (권장: tmux 안에서)
./.cursor/ralph-scripts/ralph-loop.sh -y --infinite
# 동일: ./.cursor/ralph-scripts/ralph-loop.sh -y -n 0

# 체크가 모두 [x]인데도 에이전트만 돌리고 싶을 때
./.cursor/ralph-scripts/ralph-loop.sh -y --infinite --force
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
- **`ralph-parallel.sh` 병합** — `main`에 합칠 때 첫 `merge`가 실패하면 `merge --abort` 후 **`merge -X theirs`로 한 번 재시도**한다(충돌 시 에이전트 브랜치 쪽을 우선). 병합 직전 `git checkout`이 stdout에 브랜치 전환 메시지를 내면 `success` 판별이 깨져 전부 ❌로 보이던 버그가 있어, checkout 은 `/dev/null`로 묶는다. 그래도 실패하면 ❌로 남기며, stderr는 해당 실행의 `.ralph/parallel/<run>/merge-errors.log`에 쌓인다. 동일 파일을 여러 에이전트가 크게 바꾸면 자동 해소가 어렵다 — `<!-- group: N -->`로 태스크를 나누거나 `--max-parallel 1`에 가깝게 줄인다. 실행 끝 요약은 **에이전트 코딩 단계**(Agent runs OK)와 **병합 단계**(Integrated / Merge failures)를 **별도 줄**로 구분한다(병합이 전부 ❌여도 에이전트 OK 숫자만큼 코딩은 성공한 것). **병합 대상 브랜치(`main` 등)에 커밋되지 않은 수정·미추적 파일**이 있으면 `git merge`가 “would be overwritten”로 **전부 거부**된다 — 수동으로 커밋·`git stash push -u` 후 재실행하거나, **`RALPH_MERGE_AUTOCOMMIT=1`**(병합 전 `git add -A` 후 스냅샷 커밋) 또는 **`RALPH_MERGE_AUTOSTASH=1`**(stash → 병합 → `stash pop`)을 쓴다. **`ralph-loop.sh` 병렬·병합**이면 두 변수를 아예 안 주면 **기본으로 `RALPH_MERGE_AUTOCOMMIT=1`** 이 켜진다(끄려면 `RALPH_MERGE_AUTOCOMMIT=0`). **`.ralph/` 전체는 git에 올리지 않는다**(`.gitignore`) — 로컬 진행·캐시·병렬 로그만 두고 merge 노이즈를 줄인다. 예전에 `.ralph/` 아래를 추적했으면 `git rm -r --cached .ralph` 로 인덱스만 정리한다.
- 결제 구현·질의 시: [LLMs로 결제 연동하기](https://docs.tosspayments.com/guides/v2/get-started/llms-guide), 문서 맥락 [llms.txt](https://docs.tosspayments.com/llms.txt), 필요 시 MCP(가이드 내 Cursor 절)로 v2 스펙을 조회한다.
- 로컬 서버 스모크 시 **포트 3000 고정**: `npm run dev`(선행 `kill:3000`). 테스트마다 `-p 3020` 등으로 포트를 늘리지 않는다(`scripts/kill-port.sh`).
- **`ralph-loop.sh` 진행률** — `Progress: A / B`는 `RALPH_TASK.md` 전체에서 **목록 체크박스**(`- [ ]` / `- [x]`, `*`·`1.` 시작 동일)만 센다. B가 0이면 “기준이 없음”으로 곧바로 루프에 안 들어간다. **전부 `[x]`이면 남은 일 0으로 보고 기본은 즉시 종료**(`Task already complete!`)한다. 그래도 에이전트를 돌리려면 **`--force` / `-f`** 또는 **`FORCE_RALPH_TASK_GUARD=1`** 로 조기 종료를 건너뛴다. **병렬 + 무한**이면 전부 `[x]`인 뒤에도 **기획 1회 → 새 `[ ]` → `run_parallel_tasks` 재실행**으로 바깥 루프가 이어진다(확장이 5회 연속 실패하면 스크립트가 종료한다). **병렬만(무한 아님)** 이면 미완 `[ ]`가 없을 때 한 번에 끝나는 것이 정상이다. 에이전트 프롬프트와 루프는 **`origin`이 있으면 커밋 후 `git push`**를 전제로 한다; 자동 푸시는 **`RALPH_SKIP_POST_PUSH=1`** 로 끌 수 있다.
- **체크가 가득 찼을 때** — 제품이 “끝난” 것이 아니라 **비교·확장 라운드**로 본다. `Goal`의 **성장 루프**와 Success **「성장·동종 비교」**·메타 **동종 비교 → 체크 확장**을 따른다.
