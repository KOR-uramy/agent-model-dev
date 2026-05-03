# 병렬 에이전트 job6 보고 — 트래픽·운영 (수집 API·대시보드)

## 변경 요약

1. **동종 대비 `[ ]` 백로그** — `docs/traffic-operations-peer-checklist.md`에 Datadog/GitHub 등 공개 문서 링크와 함께 남용 방어·관측·알림·쿼터 과제를 `- [ ]`로 정리했다. 오케스트레이터용 발췌는 `.ralph/parallel/1777812867-0adde5c8/RALPH_TASK-growth-traffic-append.md`.
2. **수집 API** — `apps/open-graze/lib/ingest-rate-limit.ts`로 API 키별 고정 윈도 레이트 리밋(환경 변수로 끄기·조정). 429 시 `Retry-After`·`X-RateLimit-*`·JSON `code: rate_limited`. 429·413 시 구조화 `console.warn` JSON.
3. **대시보드** — 워크스페이스 상세의 수집 키 섹션에 한도·429·로그 이벤트명·본문 상한 env 안내 블록 추가.
4. **self-test 관측** — `scripts/platform-self-test.mjs`가 성공 응답의 `X-RateLimit-*` 헤더를 있으면 출력.

## 수정·추가된 파일

- `apps/open-graze/lib/ingest-rate-limit.ts` (신규)
- `apps/open-graze/lib/workspace-task-status.ts` (신규 — 워크트리에 누락돼 있던 대시보드 의존성 복구)
- `apps/open-graze/app/api/v1/events/route.ts`
- `apps/open-graze/app/dashboard/[slug]/page.tsx`
- `docs/traffic-operations-peer-checklist.md` (신규)
- `scripts/platform-self-test.mjs`
- `.ralph/parallel/1777812867-0adde5c8/RALPH_TASK-growth-traffic-append.md` (신규)
- `.ralph/parallel/1777812867-0adde5c8/agent-job6.md` (본 파일)

## 테스트 실행

- 루트: `npm run build`
- (선택) 앱 기동 후 키가 있을 때: `npm run platform:self-test` — 성공 시 레이트 헤더가 콘솔에 찍힐 수 있음.
- (수동) 동일 키로 `INGEST_RATE_LIMIT_PER_WINDOW=2` 등 낮춘 뒤 연속 `POST /api/v1/events`로 429·`Retry-After` 확인.

## 주의사항

- **인메모리** 레이트 리밋은 프로세스(인스턴스)마다 따로다. 멀티 인스턴스·서버리스에서는 합산 한도가 아니다 — 체크리스트에 분산 한도 과제로 남겼다.
- `RALPH_TASK.md`·`.ralph/progress.md`·의존성 락파일·루트 README 등 병렬 금지 파일은 건드리지 않았다.
- 빌드 시 `AUTH_SECRET` 미설정 경고는 기존 앱 동작이다(로컬 빌드 검증에는 영향 없음).
- 환경 변수: `INGEST_RATE_LIMIT_PER_WINDOW`(기본 120, `0` 비활성), `INGEST_RATE_LIMIT_WINDOW_MS`(기본 60000), 기존 `INGEST_MAX_BODY_BYTES`, 선택 `INGEST_LOG_EACH_REQUEST=1`.
