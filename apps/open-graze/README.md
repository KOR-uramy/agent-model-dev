# OpenGraze (통합 앱)

**한 Next 앱**에서 다음을 제공합니다.

- **`/`** — SQLite **`TimelineEvent`** 타임라인(원본은 `.ralph/*.jsonl` → 동기화 API로 적재)
- **`/login`**, **`/dashboard`** — Google 로그인(Auth.js), 워크스페이스, API 키, 수집 이벤트
- **`POST /api/v1/events`** — Bearer API 키로 클라우드 수집
- **웹훅** — `/api/webhooks/stripe`(레거시), `/api/webhooks/telegram`

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
| 결제 | `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` — [토스 LLMs 가이드](https://docs.tosspayments.com/guides/v2/get-started/llms-guide) |
| Stripe 레거시 | `STRIPE_*`, `NEXT_PUBLIC_APP_URL` |
| 텔레그램 | `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_CHAT_WORKSPACE_MAP`, … |

자기 연동 스모크는 저장소 루트 `npm run platform:self-test`와 루트 `.env.example`을 참고하세요.
