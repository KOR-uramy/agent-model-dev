# Agent job6 — 트래픽·운영 (수집 API·대시보드 남용 방어·관측·알림)

## 변경 요약

1. **`docs/traffic-operations-peer-checklist.md`** — 동종 대비 참고 표에 SRE 모니터링·알림 설계 행을 추가하고, **알림·운영 런북**, **대시보드 UX·관측** 절에 측정 가능한 `- [ ]` 항목(합성 헬스, 429/5xx 알림·쿨다운, 쿼터 임박 알림, DLQ, 요청 상관 ID, 비인증 스팸 방어, 레이트 잔량 UI, 폴링 백오프 안내 등)을 추가했다. 구현 스냅샷에 `platform:self-test`의 `meta/limits` 검증을 한 줄로 적었다.
2. **`scripts/platform-self-test.mjs`** — `POST /api/v1/events` 전에 **`GET /api/v1/meta/limits`**를 호출해 JSON 스키마(수집 본문 상한·레이트 비활성 플래그, 대시보드 이벤트 목록 레이트)를 스모크한다. 운영·쿼터 안내 엔드포인트의 회귀 방지에 해당한다.
3. **`apps/open-graze/app/dashboard/[slug]/page.tsx`** — 누락돼 빌드를 깨던 `copyHint`, `publicOrigin`, 클립보드 복사 핸들러를 복구했다.
4. **`apps/open-graze/app/dashboard/page.tsx`** — 잘못 삽입된 `</div>` 제거(문법 오류).
5. **`apps/open-graze/app/login/page.tsx`** — `AuthCard`·`inputField` import 및 `registered` 쿼리 플래그 복구(타입체크 실패 해소).

`RALPH_TASK.md`는 오케스트레이터 전용으로 **수정하지 않았다**. `.ralph/progress.md`는 병렬 규칙상 **건드리지 않았다**.

## 수정·추가된 파일

| 파일 |
|------|
| `docs/traffic-operations-peer-checklist.md` |
| `scripts/platform-self-test.mjs` |
| `apps/open-graze/app/dashboard/[slug]/page.tsx` |
| `apps/open-graze/app/dashboard/page.tsx` |
| `apps/open-graze/app/login/page.tsx` |
| `.ralph/parallel/1777814494-29aff6a6/agent-job6.md` |

## 테스트 실행 방법

- **전체 빌드:** 저장소 루트에서 `npm run build`
- **플랫폼 스모크(수집 + 공개 한도):** OpenGraze dev 기동 후 루트 `.env` 등에 `OPENGRAZE_PLATFORM_API_KEY`(및 필요 시 `OPENGRAZE_PLATFORM_URL`) 설정 뒤 `npm run platform:self-test` — 이제 응답에 `meta/limits` 확인 로그가 먼저 출력된다.

## 주의사항

- `.ralph/`는 기본적으로 git에 올리지 않을 수 있어, **에이전트 리포트 파일은 로컬 병합 시 수동으로 반영**해야 할 수 있다.
- Next가 상위 디렉터리 `package-lock.json`을 워크스페이스 루트로 추론한다는 **경고**는 기존 구조 이슈이며, 이번 변경과 무관하다.
- `registered=1`은 가입 후 로그인 안내 배너용; 가입 플로우에서 해당 쿼리를 붙이지 않으면 배너는 나오지 않는다(동작은 안전).
