> 병렬 에이전트(job6) 산출물. `RALPH_TASK.md` **「성장·동종 비교」**의 **트래픽·운영** 불릿 아래에 **하위 `- [ ]`**로 붙이거나, 본문이 길면 `docs/traffic-operations-peer-checklist.md`를 단일 백로그로 두고 여기서는 한 줄로 링크한다.

## `RALPH_TASK.md`에 붙일 하위 체크(발췌)

- [ ] **분산 레이트 리밋** — Redis 등으로 `POST /api/v1/events` 한도를 인스턴스 간 공유한다.
- [ ] **수집 메트릭** — `ingest_requests_total` / `ingest_429_total` / 지연 히스토그램을 노출한다.
- [ ] **대시보드 조회 API 레이트** — `GET …/events` 등에 사용자·워크스페이스 단위 캡을 둔다.
- [ ] **쿼터 알림** — 일일 이벤트 건수·429 급증 시 웹훅·이메일·텔레그램 중 선택 정책을 구현한다.
- [ ] **공개 한도 표** — 익명 `GET …/limits` 또는 정적 표로 기본 한도·리셋 주기를 노출한다.

전체 목록·동종 링크는 `docs/traffic-operations-peer-checklist.md`를 본다.
