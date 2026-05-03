# 트래픽·운영 — 수집 API·대시보드 (동종 대비 백로그)

`RALPH_TASK.md` **「성장·동종 비교」→ 트래픽·운영** 축을 구체화한다. 비교 참고는 공개 문서 수준에서만 적는다(제품 패리티 주장 아님).

## 동종 참고(공개 문서)

| 축 | 참고 | 우리와의 대조 한 줄 |
|----|------|---------------------|
| 수집·에이전트 | [Datadog Agent / 수집](https://docs.datadoghq.com/agent/) | 호스트·클러스터 단위 버퍼·백오프·큐가 있고, 단일 HTTP 수집 엔드포인트만으로는 운영 신호가 부족할 수 있다. |
| API 한도·헤더 | [GitHub REST rate limit](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28) | `X-RateLimit-*`·`Retry-After`·secondary limit 개념이 문서화되어 클라이언트가 기대 동작을 맞출 수 있다. |
| 웹훅 남용 | [GitHub Webhooks](https://docs.github.com/en/webhooks) | 서명·재시도·실패 시 상태 코드 규약이 명확하다. |
| 대시보드·알림 | 일반 SaaS(관측·에러 트래킹) | 워크스페이스별 쿼터·알림 채널·감사 로그 UI가 흔하다. |
| APM·트레이싱 | [OpenTelemetry](https://opentelemetry.io/docs/) | 스팬·메트릭·로그 상관관계로 “수집 한 건”을 요청 전후까지 추적하기 쉽다. |
| 상태·사고 소통 | [statuspage.io](https://statuspage.io) 등 관례 | 한도·장애 시 사용자 기대치를 맞추기 위해 공개 채널이 흔하다. |

## 현재 구현 스냅샷(이 레포)

- `POST /api/v1/events`: 본문 상한(`INGEST_MAX_BODY_BYTES`), **API 키별** 고정 윈도 레이트 리밋(`INGEST_RATE_LIMIT_PER_WINDOW` / `INGEST_RATE_LIMIT_WINDOW_MS`, `0`이면 비활성), 성공·거절 시 `X-RateLimit-*`, 429 시 `Retry-After` 및 JSON `retryAfterSeconds`·`code: rate_limited`. 429·대형 본문 거절 시 서버 `console`에 JSON 한 줄(`ingest_rate_limited`, `ingest_body_rejected`). 선택 `INGEST_LOG_EACH_REQUEST=1`으로 성공 로그.
- `GET /api/workspaces/[slug]/events`(대시보드 세션): **사용자+워크스페이스** 단위 고정 윈도(`DASHBOARD_EVENTS_GET_RATE_LIMIT_PER_WINDOW` / `DASHBOARD_EVENTS_GET_RATE_LIMIT_WINDOW_MS`, `0`이면 비활성). 429 시 `ingest`와 동형의 헤더·JSON `code: rate_limited`, 로그 `dashboard_events_list_rate_limited`.
- `GET /api/v1/meta/limits`(비인증): 수집·대시보드 목록 조회의 **기본 한도 스냅샷** JSON(비밀 없음).
- 대시보드 워크스페이스 상세: 수집 POST **HTTP 코드 플레이북 표**, 레이트·로그 키워드, `meta/limits` 링크를 **인앱**으로 안내.
- 인메모리 레이트 리밋: **프로세스(또는 인스턴스) 단위**이며, 수평 확장 시 합산 한도는 아니다.

## 측정 가능한 과제 (`- [ ]`)

### 수집 API — 남용 방어

- [ ] **분산 레이트 리밋** — Redis(또는 Postgres 슬라이딩 카운터)로 키·워크스페이스 단위 한도를 인스턴스 간 공유한다.
- [ ] **IP + 키 결합** — 유효 키 없는 스팸은 IP/ASN 단위 차단·캡차 후보를 검토한다(개인정보·오탐 정책 포함).
- [ ] **버스트 허용** — 토큰 버킷 또는 짧은 버스트 계수로 GitHub secondary limit에 가까운 완화를 문서·헤더에 맞춘다.
- [ ] **멱등 키** — `Idempotency-Key` 헤더로 동일 페이로드 재전송 시 중복 적재를 막는다.
- [ ] **워크스페이스 일일 쿼터** — 이벤트 건수·페이로드 바이트 합을 일 단위로 상한(알림 전 단계: 거절 또는 큐).

### 수집 API — 관측·로그

- [ ] **구조화 로그 싱크** — `console` 대신 OpenTelemetry·중앙 로그로 `ingest_*` 이벤트를 보내고 샘플링 정책을 적는다.
- [ ] **메트릭** — `ingest_requests_total`, `ingest_429_total`, `ingest_latency_ms` 히스토그램을 노출한다(Prometheus 등).
- [ ] **분당 성공 로그** — `INGEST_LOG_EACH_REQUEST` 대신 샘플링 비율 환경 변수로 운영 비용을 제어한다.

### 대시보드 — 관측·알림

- [x] **수집 실패 UX(요약 표)** — 워크스페이스 상세에 401·400·413·429 한 줄 플레이북 표(키 노출 없음). 심화: self-test·CI가 응답 코드별 힌트를 출력(`docs/ux-friction-scenarios.md` S11 ingest 과제와 연계).
- [x] **대시보드 API 레이트(기본)** — `GET …/workspaces/[slug]/events`에 사용자+워크스페이스 단위 인메모리 윈도, 429·`X-RateLimit-*`·`dashboard_events_list_rate_limited` 로그.
- [ ] **대시보드 API 레이트(분산·전 엔드포인트)** — Redis 등으로 인스턴스 간 공유하고, `api-keys`·`tasks` 등 다른 세션 GET에도 동일 패턴 적용 여부를 정한다.
- [ ] **알림 채널** — 워크스페이스별 “일일 수집 N건 초과·429 급증”을 이메일·웹훅·텔레그램으로 보낼지 정책을 정한다.
- [ ] **감사 로그** — API 키 생성·삭제·이름 변경을 시간순으로 보여 규제·보안 질문에 답할 수 있게 한다.
- [ ] **대시보드 오류 대시보드** — 워크스페이스별 429·413 비율을 집계해 UI에 스파크라인(또는 24h 카운트)으로 노출한다.

### 쿼터·안내·문서

- [x] **공개 한도 JSON** — 비인증 `GET /api/v1/meta/limits`로 수치·윈도(비활성 시 `null`) 스냅샷.
- [ ] **공개 쿼터 페이지(HTML)** — 로그인 없이 읽는 “한도 표” 랜딩 또는 `/limits` 정적 페이지(브랜딩·SEO).
- [x] **429 클라이언트 가이드(문서)** — `docs/opengraze-llms-guide.md`에 `Retry-After`·지수 백오프·`meta/limits` 링크.
- [ ] **429 클라이언트 가이드(SDK)** — `ralph-workspace-sdk` 또는 예제 스크립트에 재시도 유틸을 넣는다.
- [ ] **SLA / 상태 페이지** — 외부 상태 페이지 링크 또는 “베타·무 SLA” 한 줄을 랜딩·README 정책에 맞춘다(루트 README 수정이 필요하면 오케스트레이터 범위로).

---

동종에서 새 갭이 보이면 **한 줄 근거(링크) + `- [ ]` 1개 이상**을 이 파일에 추가한다. `RALPH_TASK.md` 본문 반영은 오케스트레이터가 `.ralph/parallel/…/RALPH_TASK-growth-traffic-append.md` 또는 이 파일을 참고해 병합한다.
