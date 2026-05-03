# Agent job3 보고 — 운영 가시화(수집 한도 신호)

## 변경 요약

- `POST /api/v1/events`가 429일 때 이미 내려주던 `Retry-After`·`code: "rate_limited"`·`retryAfterSeconds`에 더해, **윈도 리셋 시각**을 기계 판독 가능한 **`retryableAt`(ISO 8601 UTC)** 로 JSON 본문에 명시했다.
- 동일 레이트 응답 형태를 쓰는 **`GET /api/workspaces/[slug]/events`** 429 본문에도 같은 필드를 넣어 대시보드·수집 API 간 계약을 맞췄다.
- 루트 **`README.md`**에 `INGEST_RATE_LIMIT_PER_WINDOW=1` 전제 하에 **한 줄 `curl`**로 두 번째 `POST`의 429 응답(헤더+본문)을 확인하는 절차를 추가했다(과제에서 README 수정이 명시됨).

## 수정한 파일

- `apps/open-graze/app/api/v1/events/route.ts`
- `apps/open-graze/app/api/workspaces/[slug]/events/route.ts`
- `README.md`
- `.ralph/parallel/1777816766-b1d8fe57/agent-job3.md` (본 보고서)

## 테스트

- 저장소에 **단위 테스트 러너(vitest/jest 등)가 없어** 자동 테스트 스크립트는 추가하지 않았다.
- 변경 API 라우트만 `npx eslint app/api/v1/events/route.ts app/api/workspaces/[slug]/events/route.ts`로 통과 확인.
- 현재 워크트리에서 `npm run build -w open-graze`는 **`page.tsx`·`ui-tokens.ts`의 기존 중복 선언** 때문에 실패할 수 있으며, 이번 diff와 무관하다.
- 수동: README에 적은 대로 OpenGraze를 `INGEST_RATE_LIMIT_PER_WINDOW=1`로 기동한 뒤, 제시한 `curl` 한 줄을 실행하면 두 번째 응답에 `HTTP/1.1 429`, `Retry-After`, JSON의 `code`·`retryAfterSeconds`·`retryableAt`이 보인다.

## 주의사항

- `.ralph/progress.md`·`RALPH_TASK.md`는 수정하지 않았다.
- `.ralph/`는 `.gitignore`에 있으므로 보고서 커밋 시 **`git add -f .ralph/parallel/1777816766-b1d8fe57/agent-job3.md`** 가 필요할 수 있다.
- `INGEST_RATE_LIMIT_PER_WINDOW=0`이면 레이트가 꺼져 429를 재현할 수 없다. `GET /api/v1/meta/limits`의 `rateLimitDisabled`로 확인한다.
