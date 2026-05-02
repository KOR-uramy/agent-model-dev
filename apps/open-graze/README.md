# OpenGraze (통합 앱)

**한 Next 앱**에서 다음을 제공합니다.

- **`/`** — SQLite **`TimelineEvent`** 타임라인(원본은 `.ralph/*.jsonl` → 동기화 API로 적재)
- **`/login`**, **`/dashboard`** — Google 로그인(Auth.js), 워크스페이스, API 키, 수집 이벤트
- **`POST /api/v1/events`** — Bearer API 키로 클라우드 수집
- **웹훅** — `/api/webhooks/toss`(토스 v2), `/api/webhooks/stripe`(레거시), `/api/webhooks/telegram`

### 수집 API 남용 완화

- **앱**: 요청 본문은 기본 **256KiB** 상한이다. `INGEST_MAX_BODY_BYTES`로 덮어쓸 수 있으며(상한 10MiB), 초과 시 **413**과 `Request body too large` 메시지를 반환한다. `Content-Length`가 본문보다 크면 선제 거절한다.
- **운영**: 프로덕션 앞단(nginx, Cloudflare, API Gateway 등)에서 **클라이언트별 레이트 리밋**과 `client_max_body_size` / 동등 설정을 두는 것을 권장한다. 앱 단일 인스턴스만으로는 분산 남용을 막기 어렵다.

기본 포트 **3000**만 사용한다. 루트에서 `npm run dev` 시 이미 `3000`이 쓰이 중이면 먼저 종료 후 기동(`scripts/dev-open-graze.sh`).

## 개발

저장소 루트:

```bash
npm install
cp apps/open-graze/.env.example apps/open-graze/.env
# DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_* 등 입력

npm run db:migrate -w open-graze   # 최초 1회
npm run dev
```

직접 `npm run dev -w open-graze`만 쓸 때도 **`npm run kill:3000`** 후 실행해 포트를 하나로 유지한다.

`RALPH_WORKSPACE` 등은 **동기화 시** JSONL 경로를 찾는 데 쓰입니다. 워크스페이스·로그인을 쓰려면 DB·OAuth 설정이 필요합니다.

## 핵심 플로 (결제 미설정)

`NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`, Stripe 관련 변수는 **비워 둔 채**로 아래만 수행하면 **Google 로그인 → 워크스페이스 → API 키 → `POST /api/v1/events` 수집**까지 재현할 수 있습니다.

```bash
# 저장소 루트에서
npm install
cp apps/open-graze/.env.example apps/open-graze/.env
```

`apps/open-graze/.env`에서 최소한 다음을 채웁니다.

- `DATABASE_URL="file:./dev.db"` (스키마 디렉터리 기준으로 `prisma/dev.db`에 생성)
- `AUTH_SECRET`, `AUTH_URL="http://localhost:3000"`, `AUTH_TRUST_HOST="true"`
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (Google Cloud 콘솔 OAuth 클라이언트; 리다이렉트 URI에 `http://localhost:3000/api/auth/callback/google` 등록)

토스·Stripe 필드는 생략해도 됩니다.

```bash
npm run db:migrate -w open-graze
npm run kill:3000
npm run dev
```

1. 브라우저에서 `http://localhost:3000/login` — Google로 로그인  
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

Ralph 루프·`appendWorkspaceTelemetryEvent`는 **여전히 JSONL에 기록**합니다. 대시보드에 반영하려면 루프/작업 후 위 동기화를 주기적으로 실행하거나(또는 나중에 훅으로 자동화) 하면 됩니다.

## 환경 변수 요약

| 구간 | 변수 |
|------|------|
| 수집 API 본문 상한 | `INGEST_MAX_BODY_BYTES`(선택, 기본 256KiB) |
| 타임라인 동기화 | `RALPH_FEED_SYNC_SECRET`, `RALPH_WORKSPACE`, `RALPH_EVENTS_JSONL`, `OPENGRAZE_TELEMETRY_JSONL`, `RALPH_USD_PER_MILLION_EST_TOKENS` — SDK README |
| DB / Auth | `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| 결제 | `NEXT_PUBLIC_TOSS_CLIENT_KEY`(결제위젯 연동 키), `TOSS_SECRET_KEY`, 선택 `TOSS_SUBSCRIPTION_AMOUNT_KRW`, `TOSS_WEBHOOK_SECRET` — [토스 LLMs 가이드](https://docs.tosspayments.com/guides/v2/get-started/llms-guide), [웹훅](https://docs.tosspayments.com/guides/v2/webhook) |
| Stripe 레거시 | `STRIPE_*`, `NEXT_PUBLIC_APP_URL` |
| 텔레그램 | `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_CHAT_WORKSPACE_MAP`, … |

자기 연동 스모크는 저장소 루트 `npm run platform:self-test`와 루트 `.env.example`을 참고하세요.

## 토스페이먼츠 v2 구독(단건) 결제

1. [개발자센터](https://developers.tosspayments.com/)에서 **결제위젯 연동** 클라이언트 키·시크릿 키를 발급해 `.env`에 넣습니다. `NEXT_PUBLIC_APP_URL`(또는 요청 `Host`로 유도)이 성공·실패 리다이렉트에 쓰입니다.
2. 워크스페이스 **소유자**로 `/dashboard/{slug}` → **구독 (토스)** → `/dashboard/{slug}/billing`에서 결제위젯으로 결제합니다. 성공 시 [결제 승인 API](https://docs.tosspayments.com/reference#%EA%B2%B0%EC%A0%9C-%EC%8A%B9%EC%9D%B8)를 `/api/billing/toss/confirm`이 호출해 `subscriptionStatus`를 갱신합니다.
3. **웹훅**(선택·권장): 개발자센터에 URL `{NEXT_PUBLIC_APP_URL}/api/webhooks/toss`를 등록하고 `PAYMENT_STATUS_CHANGED`를 켭니다. 서명 검증은 [웹훅 이벤트](https://docs.tosspayments.com/reference/using-api/webhook-events)의 `tosspayments-webhook-signature` 규칙을 따릅니다(시크릿: `TOSS_WEBHOOK_SECRET` 또는 `TOSS_SECRET_KEY`).

## 프로덕션 배포: Postgres로 전환

- **개발 전제(현재 스키마)**: `prisma/schema.prisma`의 `datasource db`는 `provider = "sqlite"`이며, 로컬은 `DATABASE_URL="file:./dev.db"`(→ `apps/open-graze/prisma/dev.db`) 형태의 **파일 DB**를 씁니다.
- **Postgres로 바꿀 때**(경로 요약):
  1. `apps/open-graze/prisma/schema.prisma`에서 `provider`를 `"postgresql"`로 바꾸고, 배포 환경의 `DATABASE_URL`을 `postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public`처럼 설정합니다.
  2. CI/호스트에서 마이그레이션 적용 시 개발용 `db:migrate` 대신 **`prisma migrate deploy`**를 사용합니다(예: `cd apps/open-graze && npx prisma migrate deploy` — 실제 명령은 배포 스크립트에 맞게 조정).
  3. 기존 SQLite `dev.db`에 쌓인 데이터를 Postgres로 옮겨야 하면, 앱이 제공하는 자동 이전은 없으므로 덤프·재적재 또는 별도 ETL이 필요합니다(모델은 Postgres와 호환되는 Prisma 타입만 사용).
  4. `AUTH_URL`과 Google OAuth **승인된 리다이렉트 URI**를 프로덕션 도메인에 맞게 갱신합니다.
