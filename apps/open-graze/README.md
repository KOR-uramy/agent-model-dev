# OpenGraze / Workspace Platform (동일 앱)

**Workspace Platform**(워크스페이스 플랫폼)과 **OpenGraze**는 같은 제품이다. 예전에 `workspace-platform`으로 부르던 통합 앱이 여기 한 곳으로 모였다. **npm 워크스페이스·폴더명**은 `open-graze`이다.

**한 Next 앱**에서 다음을 제공합니다.

- **LLM·외부 앱 연동 문서** — 저장소 루트 **`docs/opengraze-llms-guide.md`**(환경 변수·`POST /api/v1/events`·복붙 예제). 배포 후 브라우저·봇이 짧게 읽을 **`/llms.txt`** (`public/llms.txt`).
- **`/`** — SQLite **`TimelineEvent`** 타임라인(원본은 `.ralph/*.jsonl` → 동기화 API로 적재). 타임라인 JSON 한 줄의 `detail`이 객체일 때 **선택** 필드 **`role`**(`detail.role`)에 `planning` \| `design` \| `implementation` \| `test` 만 온다(`RALPH_TASK.md` 규약). 홈의 역할 필터는 **`?role=`** 쿼리와 양방향 동기화되며, `GET /api/ralph/events`의 **`role`** 과 동일한 네 가지 값만 인정한다. 세션 선택·직접 입력은 **`?sessionId=`** 와 양방향 동기화되며(값이 비어 있으면 쿼리 키 제거), **`role`** 과 함께 붙여도 `GET /api/ralph/events`와 같은 조합 의미로 동작한다. **시간 구간**은 **`?from=`**·**`?to=`**(둘 다 있어야 하며 ISO 8601, UTC **`Z`** 권장)과 양방향 동기화되며, 이 모드에서는 내부적으로 **`GET /api/ralph/events/range`** 를 쓰고 **`tail`** 과는 배타적이다(주소에 `tail`을 넣어도 홈은 고정 tail 또는 기간 중 하나만 선택). **`role`**·**`sessionId`**·**`from`**·**`to`** 를 함께 쓰면 `GET /api/ralph/events` / `GET /api/ralph/events/range` 와 동일하게 **AND** 로 조합된다.

```
http://localhost:3000/?role=planning&sessionId=ralph-session-example&from=2026-05-01T00:00:00.000Z&to=2026-05-03T23:59:59.999Z
```
- **`/register`**, **`/login`**, **`/dashboard`** — 회원가입(`POST /api/auth/register`), 이메일·비밀번호 로그인(Credentials + DB), 워크스페이스, **작업 현황**(`WorkspaceTask` — 대시보드는 **조회만**; 생성·상태 변경은 `POST`/`PATCH` **`/api/workspaces/[slug]/tasks`** 등 API), API 키, 수집 이벤트
- **`POST /api/v1/events`** — Bearer API 키로 클라우드 수집
- **웹훅** — `/api/webhooks/toss`(토스 v2), `/api/webhooks/stripe`(레거시), `/api/webhooks/telegram`

### 수집 API 남용 완화

- **앱**: 요청 본문은 기본 **256KiB** 상한이다. `INGEST_MAX_BODY_BYTES`로 덮어쓸 수 있으며(상한 10MiB), 초과 시 **413**과 `Request body too large` 메시지를 반환한다. `Content-Length`가 본문보다 크면 선제 거절한다.
- **운영**: 프로덕션 앞단(nginx, Cloudflare, API Gateway 등)에서 **클라이언트별 레이트 리밋**과 `client_max_body_size` / 동등 설정을 두는 것을 권장한다. 앱 단일 인스턴스만으로는 분산 남용을 막기 어렵다.

### 워크스페이스 작업 API (`WorkspaceTask`)

`/dashboard/{slug}` 화면은 **조회만** 한다. 제목·설명·상태를 바꾸려면 **로그인 세션**(대시보드와 동일 출처)으로 아래를 호출하면 된다(연동 스크립트·백오피스·자동화 등).

- `GET /api/workspaces/{slug}/tasks` — 목록
- `POST /api/workspaces/{slug}/tasks` — 본문 `{"title":"…","description?":"…","status?":"todo"}` (`status` 생략 시 `todo`; 허용값: `backlog` \| `todo` \| `in_progress` \| `blocked` \| `done`)
- `PATCH /api/workspaces/{slug}/tasks/{taskId}` — 본문 `{"status":"in_progress"}` 등

세션이 없으면 **401**이다. `slug`는 워크스페이스 URL slug와 같다.

기본 포트 **3000**만 사용한다. 루트에서 `npm run dev` 시 이미 `3000`이 쓰이 중이면 먼저 종료 후 기동(`scripts/dev-open-graze.sh`).

## 개발

저장소 루트:

```bash
npm install
cp apps/open-graze/.env.example apps/open-graze/.env
# DATABASE_URL, AUTH_SECRET, AUTH_URL 등 입력

npm run db:migrate -w open-graze   # 최초 1회
npm run db:seed -w open-graze      # 로컬 테스트 계정(선택·권장)
npm run dev
```

직접 `npm run dev -w open-graze`만 쓸 때도 **`npm run kill:3000`** 후 실행해 포트를 하나로 유지한다.

`RALPH_WORKSPACE` 등은 **동기화 시** JSONL 경로를 찾는 데 쓰입니다. 워크스페이스·로그인을 쓰려면 DB·`AUTH_*` 설정이 필요합니다.

## 핵심 플로 (결제 미설정)

`NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`, Stripe 관련 변수는 **비워 둔 채**로 아래만 수행하면 **이메일 로그인 → 워크스페이스 → API 키 → `POST /api/v1/events` 수집**까지 재현할 수 있습니다.

```bash
# 저장소 루트에서
npm install
cp apps/open-graze/.env.example apps/open-graze/.env
```

`apps/open-graze/.env`에서 최소한 다음을 채웁니다.

- `DATABASE_URL="file:./dev.db"` (스키마 디렉터리 기준으로 `prisma/dev.db`에 생성)
- `AUTH_SECRET`, `AUTH_URL="http://localhost:3000"`, `AUTH_TRUST_HOST="true"`
- 테스트 계정: `npm run db:seed -w open-graze` 후 기본 `dev@opengraze.local` / `opengraze-dev` (`.env.example`의 `SEED_USER_*`로 변경 가능)

토스·Stripe 필드는 생략해도 됩니다.

```bash
npm run db:migrate -w open-graze
npm run db:seed -w open-graze
npm run kill:3000
npm run dev
```

1. 브라우저에서 `http://localhost:3000/login` — 시드한 이메일·비밀번호로 로그인  
2. `http://localhost:3000/dashboard` — 워크스페이스 생성(이름·slug)  
3. 워크스페이스 대시보드에서 **API 키** 발급 후 `og_live_…` 전체 복사  
4. 수집 확인(택 1):
   - 저장소 루트에 `OPENGRAZE_PLATFORM_API_KEY=og_live_…`를 두고 `npm run platform:self-test`
   - 또는 예시 `curl`(성공 시 HTTP 200, 대시보드 **이벤트**에 `opengraze.self_test` 또는 아래 `kind`가 보임):

```bash
curl -sS -X POST "http://localhost:3000/api/v1/events" \
  -H "Authorization: Bearer og_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"kind":"opengraze.self_test","data":{"note":"curl smoke"}}'
```

## 타임라인(JSONL → SQLite)

1. `.env`에 `RALPH_FEED_SYNC_SECRET` 설정.
2. 개발 서버 실행 후:

```bash
npm run sync:feed -w open-graze
```

또는 `curl -X POST -H "Authorization: Bearer …" http://localhost:3000/api/ralph/sync-jsonl` — 본문 `{"tail":8000}` 선택.

`GET /api/ralph/events`는 선택 쿼리 **`role`**(`planning` \| `design` \| `implementation` \| `test`)로 **`detail.role`이 같은 이벤트만** 최근 `tail`건까지 반환합니다. 그 외 값은 **400**입니다. 아래 한 줄로 필터 유·무 응답의 **`events` 배열 길이**를 바로 비교할 수 있습니다(개발 서버·DB에 타임라인이 있을 때).

```bash
printf 'all=%s role=planning=%s\n' "$(curl -sS 'http://localhost:3000/api/ralph/events?tail=800' | node -p "JSON.parse(require('fs').readFileSync(0,'utf-8')).events.length")" "$(curl -sS 'http://localhost:3000/api/ralph/events?tail=800&role=planning' | node -p "JSON.parse(require('fs').readFileSync(0,'utf-8')).events.length")"
```

Ralph 루프·`appendWorkspaceTelemetryEvent`는 **여전히 JSONL에 기록**합니다. 대시보드에 반영하려면 루프/작업 후 위 동기화를 주기적으로 실행하거나(또는 나중에 훅으로 자동화) 하면 됩니다.

### 기간보내기 (`GET /api/ralph/events/range`)

동기화된 SQLite 타임라인만 읽습니다. 응답 본문은 **객체**이며, `events`가 `WorkspaceFeedEvent` 배열(대시보드 `GET /api/ralph/events`와 동일 형태)이고, SQLite `LIMIT`에 도달하면 최상위 **`truncated`: `true`**(그렇지 않으면 `false`), **`returnedCount`**는 `events.length`입니다. 상한 초과 시에도 **HTTP 413 등으로 끊지 않고** 위 필드로만 잘림을 알립니다.

- **쿼리**: `from`, `to` — 필수, ISO 8601(예: `2026-05-01T00:00:00Z`, `2026-05-03T23:59:59.999Z`). `limit` — 선택, 기본 10000, 상한 10000.
- **잘림 확인(한 줄, `truncated`·`returnedCount`)**: `curl -sS 'http://localhost:3000/api/ralph/events/range?from=1970-01-01T00:00:00Z&to=2099-12-31T23:59:59Z&limit=1' | node -p "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); [j.truncated,j.returnedCount,j.events.length].join(' ')"` — 데이터가 있으면 `true 1 1`, 없으면 `false 0 0`.
- **파일 저장 예**:

```bash
curl -sS "http://localhost:3000/api/ralph/events/range?from=2026-05-01T00:00:00Z&to=2026-05-03T23:59:59Z" -o ralph-timeline-slice.json
```

역할 필터를 넣은 **한 줄**로 구간 전체 대비 **`role=planning`만** 건수를 비교합니다(개발 서버·동기화된 DB에 해당 구간 데이터가 있을 때).

```bash
printf 'all=%s role=planning=%s\n' "$(curl -sS 'http://localhost:3000/api/ralph/events/range?from=2026-05-01T00:00:00Z&to=2026-05-03T23:59:59Z' | node -p "JSON.parse(require('fs').readFileSync(0,'utf-8')).returnedCount")" "$(curl -sS 'http://localhost:3000/api/ralph/events/range?from=2026-05-01T00:00:00Z&to=2026-05-03T23:59:59Z&role=planning' | node -p "JSON.parse(require('fs').readFileSync(0,'utf-8')).returnedCount")"
```

`role`·`sessionId`를 **같은 요청**에 넣는 **한 줄** 예(`SESSION`을 실제 ID로 바꿉니다):

```bash
curl -sS 'http://localhost:3000/api/ralph/events/range?from=2026-05-01T00:00:00Z&to=2026-05-03T23:59:59Z&role=planning&sessionId=SESSION' | node -p "JSON.parse(require('fs').readFileSync(0,'utf-8')).returnedCount"
```

#### 응답 배열에 포함되는 주요 필드(재현·감사)

| 필드 | 의미 |
|------|------|
| `ts` | **시각**(ISO 8601 문자열, JSONL 동기화 시점과 동일) |
| `kind` | **유형**(예: `session_start`, `token_snapshot`, `application_work_completed` 등) |
| `detail` | 부가 정보 객체. 역할은 문서 규약대로 선택 필드 **`detail.role`**(JSON 키 이름은 `role`) |
| `sessionId` | Ralph·텔레메트리 **세션 식별자**(없을 수 있음; 앱 이벤트는 종종 생략) |
| `source` | `ralph` 또는 `application` |
| `iteration` | Ralph 이터 번호(선택) |

## 환경 변수 요약

| 구간 | 변수 |
|------|------|
| 수집 API 본문 상한 | `INGEST_MAX_BODY_BYTES`(선택, 기본 256KiB) |
| 타임라인 동기화 | `RALPH_FEED_SYNC_SECRET`, `RALPH_WORKSPACE`, `RALPH_EVENTS_JSONL`, `OPENGRAZE_TELEMETRY_JSONL`, `RALPH_USD_PER_MILLION_EST_TOKENS` — SDK README |
| DB / Auth | `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`(로컬), 선택 `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` |
| 결제 | `NEXT_PUBLIC_TOSS_CLIENT_KEY`(결제위젯 연동 키), `TOSS_SECRET_KEY`, 선택 `TOSS_SUBSCRIPTION_AMOUNT_KRW`, `TOSS_WEBHOOK_SECRET` — [토스 LLMs 가이드](https://docs.tosspayments.com/guides/v2/get-started/llms-guide), [웹훅](https://docs.tosspayments.com/guides/v2/webhook) |
| Stripe 레거시 | `STRIPE_*`, `NEXT_PUBLIC_APP_URL` |
| 텔레그램 | `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_CHAT_WORKSPACE_MAP`, … |

자기 연동 스모크는 저장소 루트 `npm run platform:self-test`와 루트 `.env.example`을 참고하세요. 앱을 띄운 뒤 공개 API·타임라인을 HTTP로 점검하려면 루트 **`npm run runtime:smoke`**(`scripts/runtime-smoke.mjs`, 이 워크스페이스에서는 `npm run runtime:smoke -w open-graze`와 동일)를 쓰면 됩니다.

## 토스페이먼츠 v2 구독(단건) 결제

1. [개발자센터](https://developers.tosspayments.com/)에서 **결제위젯 연동** 클라이언트 키·시크릿 키를 발급해 `.env`에 넣습니다. `NEXT_PUBLIC_APP_URL`(또는 요청 `Host`로 유도)이 성공·실패 리다이렉트에 쓰입니다.
2. 워크스페이스 **소유자**로 `/dashboard/{slug}` → **구독 · 결제**(대시보드 상단 링크와 동일한 표기) → `/dashboard/{slug}/billing`에서 결제위젯으로 결제합니다. 성공 시 [결제 승인 API](https://docs.tosspayments.com/reference#%EA%B2%B0%EC%A0%9C-%EC%8A%B9%EC%9D%B8)를 `/api/billing/toss/confirm`이 호출해 `subscriptionStatus`를 갱신합니다.
3. **웹훅**(선택·권장): 개발자센터에 URL `{NEXT_PUBLIC_APP_URL}/api/webhooks/toss`를 등록하고 `PAYMENT_STATUS_CHANGED`를 켭니다. 서명 검증은 [웹훅 이벤트](https://docs.tosspayments.com/reference/using-api/webhook-events)의 `tosspayments-webhook-signature` 규칙을 따릅니다(시크릿: `TOSS_WEBHOOK_SECRET` 또는 `TOSS_SECRET_KEY`).

## 프로덕션 배포: Postgres로 전환

- **개발 전제(현재 스키마)**: `prisma/schema.prisma`의 `datasource db`는 `provider = "sqlite"`이며, 로컬은 `DATABASE_URL="file:./dev.db"`(→ `apps/open-graze/prisma/dev.db`) 형태의 **파일 DB**를 씁니다.
- **Postgres로 바꿀 때**(경로 요약):
  1. `apps/open-graze/prisma/schema.prisma`에서 `provider`를 `"postgresql"`로 바꾸고, 배포 환경의 `DATABASE_URL`을 `postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public`처럼 설정합니다.
  2. CI/호스트에서 마이그레이션 적용 시 개발용 `db:migrate` 대신 **`prisma migrate deploy`**를 사용합니다(예: `cd apps/open-graze && npx prisma migrate deploy` — 실제 명령은 배포 스크립트에 맞게 조정).
  3. 기존 SQLite `dev.db`에 쌓인 데이터를 Postgres로 옮겨야 하면, 앱이 제공하는 자동 이전은 없으므로 덤프·재적재 또는 별도 ETL이 필요합니다(모델은 Postgres와 호환되는 Prisma 타입만 사용).
  4. `AUTH_URL`·`AUTH_SECRET`을 프로덕션 도메인·비밀에 맞게 갱신합니다. 사용자는 DB의 `passwordHash`(bcrypt)로 인증됩니다.
