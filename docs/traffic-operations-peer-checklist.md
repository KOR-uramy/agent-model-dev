# 트래픽·운영 — 수집 API·대시보드 (동종 대비 백로그)

`RALPH_TASK.md` **「성장·동종 비교」→ 트래픽·운영** 축을 구체화한다. 비교 참고는 공개 문서 수준에서만 적는다(제품 패리티 주장 아님).

## 동종 참고(공개 문서)

| 축 | 참고 | 우리와의 대조 한 줄 |
|----|------|---------------------|
| 수집·에이전트 | [Datadog Agent / 수집](https://docs.datadoghq.com/agent/) | 호스트·클러스터 단위 버퍼·백오프·큐가 있고, 단일 HTTP 수집 엔드포인트만으로는 운영 신호가 부족할 수 있다. |
| API 한도·헤더 | [GitHub REST rate limit](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28) | `X-RateLimit-*`·`Retry-After`·secondary limit 개념이 문서화되어 클라이언트가 기대 동작을 맞출 수 있다. |
| 웹훅 남용 | [GitHub Webhooks](https://docs.github.com/en/webhooks) | 서명·재시도·실패 시 상태 코드 규약이 명확하다. |
| 대시보드·알림 | 일반 SaaS(관측·에러 트래킹) | 워크스페이스별 쿼터·알림 채널·감사 로그 UI가 흔하다. |

## 현재 구현 스냅샷(이 레포)

- `POST /api/v1/events`: 본문 상한(`INGEST_MAX_BODY_BYTES`), **API 키별** 고정 윈도 레이트 리밋(`INGEST_RATE_LIMIT_PER_WINDOW` / `INGEST_RATE_LIMIT_WINDOW_MS`, `0`이면 비활성), 성공·거절 시 `X-RateLimit-*`, 429 시 `Retry-After` 및 JSON `retryAfterSeconds`·`code: rate_limited`. 429·대형 본문 거절 시 서버 `console`에 JSON 한 줄(`ingest_rate_limited`, `ingest_body_rejected`). 선택 `INGEST_LOG_EACH_REQUEST=1`으로 성공 로그.
- 대시보드 워크스페이스 상세: 위 한도·429 대응·로그 이벤트명을 **인앱 한 블록**으로 안내.
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

- [ ] **수집 실패 UX** — self-test·CI에서 429·413·401 응답을 구분해 대시보드 **연동 예시** 옆에 “자주 나는 코드” 표를 둔다(`docs/ux-friction-scenarios.md` ingest 플레이북과 연계).
- [ ] **대시보드 API 레이트** — `GET …/events` 등 세션 API에 사용자·워크스페이스 단위 레이트를 두어 스크래핑·실수 폴링을 완화한다.
- [ ] **알림 채널** — 워크스페이스별 “일일 수집 N건 초과·429 급증”을 이메일·웹훅·텔레그램으로 보낼지 정책을 정한다.
- [ ] **감사 로그** — API 키 생성·삭제·이름 변경을 시간순으로 보여 규제·보안 질문에 답할 수 있게 한다.

### 쿼터·안내·문서

- [ ] **공개 쿼터 페이지** — 로그인 없이 읽을 수 있는 “기본 한도 표”(수치·리셋 주기) 또는 `GET /api/v1/meta/limits` 같은 읽기 전용 엔드포인트.
- [ ] **429 클라이언트 가이드** — SDK·`docs/opengraze-llms-guide.md`에 지수 백오프 의사코드와 `Retry-After` 준수를 명시한다.
- [ ] **SLA / 상태 페이지** — 외부 상태 페이지 링크 또는 “베타·무 SLA” 한 줄을 랜딩·README 정책에 맞춘다(루트 README 수정이 필요하면 오케스트레이터 범위로).

---

동종에서 새 갭이 보이면 **한 줄 근거(링크) + `- [ ]` 1개 이상**을 이 파일에 추가한다. `RALPH_TASK.md` 본문 반영은 오케스트레이터가 `.ralph/parallel/…/RALPH_TASK-growth-traffic-append.md` 또는 이 파일을 참고해 병합한다.
