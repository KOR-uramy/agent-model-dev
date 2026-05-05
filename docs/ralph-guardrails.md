# Ralph Guardrails (Signs)

> Lessons learned from past failures. READ THESE BEFORE ACTING.

## Core Signs

### Sign: Read Before Writing
- **Trigger**: Before modifying any file
- **Instruction**: Read the existing file first

### Sign: No Secrets in Git
- **Trigger**: Before any commit
- **Instruction**: Never commit API keys; use local env or ignored config only

### Sign: Scope to This Repo + Linked App
- **Trigger**: When tempted to "fix everything"
- **Instruction**: Only change what the user asked for in `RALPH_TASK.md`

### Sign: Verify Builds on App Repo
- **Trigger**: After changing integration code in another clone
- **Instruction**: Run that repo's build/test commands and note result

---

## Learned Signs

### Sign: Prisma SQLite `DATABASE_URL` is schema-relative
- **Trigger**: `apps/open-graze`에서 `prisma/schema.prisma`가 `prisma/` 안에 있을 때
- **Instruction**: `DATABASE_URL`은 **스키마 파일이 있는 폴더** 기준이다. `file:./dev.db` → `prisma/dev.db`. `file:./prisma/dev.db`는 중첩 `prisma/prisma/dev.db`를 만들 수 있으므로 쓰지 않는다.

### Sign: OpenAI 401 “Missing bearer” (auth not loaded)
- **Trigger**: `.ralph/errors.log`에 `401 Unauthorized: Missing bearer or basic authentication in header`가 반복되며 스트림이 `NON-RETRYABLE`로 끊길 때
- **Instruction**: Ralph/에이전트 실행 전에 **인증이 실제로 로드됐는지**를 먼저 확인한다(로컬 셸에 `OPENAI_API_KEY` 등 필수 env가 export되어 있는지, 실행 주체가 그 env를 상속하는지). 키를 고치기 전까지는 재시도 루프를 돌리지 말고, 1회 확인 후 다시 실행한다.
- **Added after**: Iteration 1 — 2026-05-03 23:59 KST에 stream-parser가 OpenAI Responses API 연결에서 연속 401(“Missing bearer…”)을 기록

### Sign: Git index.lock EPERM (sandbox can’t write `.git/`)
- **Trigger**: `git add/commit/checkout/push`에서 `Unable to create ... .git/index.lock: Operation not permitted` 또는 `.git/*`에 `touch`가 실패할 때
- **Instruction**: 이 환경에서는 `.git/` 쓰기가 막힐 수 있다. 이 경우 **호스트 터미널에서** `git add -A && git commit ... && git push`를 수행하고, 에이전트는 `.ralph/progress.md`에 **변경 파일 목록 + 다음 인계**만 남긴다(“커밋/푸시를 에이전트가 대신”하려고 재시도 루프를 돌리지 말 것).
- **Added after**: Iteration 1 — 2026-05-04에 Codex CLI 샌드박스에서 `.git/index.lock` 생성이 EPERM으로 차단됨

### Sign: Next app route should expose a simple `GET` 405 stub when it is write-only
- **Trigger**: `app/api/**/route.ts`에서 `POST` / `PATCH` / `DELETE` 같은 쓰기 전용 handler만 만들 때
- **Instruction**: Next app route는 쓰기 전용이어도 **간단한 `GET` 405 응답**(`Allow` 헤더 포함)을 함께 export하는 것을 기본값으로 둔다. `POST` 전용 route를 만들고 끝내지 말고, 처음부터 `methodNotAllowed("POST")` 같은 공통 헬퍼를 같이 넣은 뒤 build를 확인한다.
- **Added after**: Iteration 1 — 2026-05-05에 `/api/v1/events`가 `POST`만 export된 상태에서 `next build`의 route/page-data 수집 단계가 꼬이며 Ralph loop 시작 빌드를 막음

### Sign: Clean `.next` before webpack `next build` when dev used Turbopack
- **Trigger**: `next dev --turbopack`를 쓴 뒤 `next build`에서 `/_error`, `/_document`, `[turbopack]_runtime.js` 관련 `PageNotFoundError` / `MODULE_NOT_FOUND`가 날 때
- **Instruction**: 개발 서버(Turbopack)와 배포 빌드(webpack)가 같은 `.next` 산출물을 섞어 쓰지 않게, 빌드 전에 **`.next`를 비우고** 다시 `next build`한다. 이 레포의 `apps/open-graze`는 build 스크립트 자체가 `rm -rf .next && next build`를 기본으로 가져가야 한다.
- **Added after**: Iteration 1 — 2026-05-05에 `next dev --turbopack` 잔여물 때문에 `.next/server/pages/_document.js`가 `[turbopack]_runtime.js`를 require하며 Ralph loop 시작 빌드를 막음

### Sign: Unsupported Codex model should fall back to `auto`
- **Trigger**: `.ralph/errors.log`에 `The '...codex...' model is not supported when using Codex with a ChatGPT account.` 같은 400 invalid_request_error가 찍힐 때
- **Instruction**: 고정 모델 재시도 루프를 돌리지 말고, Ralph 스크립트 모델을 즉시 `auto`로 낮춰 같은 이터를 재시도한다. 이후 에러 상태는 `MODEL FALLBACK` 같은 해결 마커 기준으로 정리해 recovery 루프에 갇히지 않게 한다.
- **Added after**: Iteration 1 — 2026-05-05에 `gpt-5.1-codex-mini` 지정이 ChatGPT 계정에서 거부되어 구현 단계가 시작 직후 중단됨

### Sign: Never inject raw giant error lines back into the Ralph prompt
- **Trigger**: `.ralph/errors.log` 한 줄이 비정상적으로 길거나 `Input exceeds the maximum length of 1048576 characters.` 같은 turn/start 실패가 날 때
- **Instruction**: 에러 요약을 프롬프트에 넣을 때는 최근 몇 줄만 쓰고, 각 줄 길이를 강하게 잘라 재귀적으로 로그 전체가 다시 프롬프트에 들어가지 않게 한다. 스트림 파서도 원본 에러를 그대로 적지 말고 요약본만 남긴다.
- **Added after**: Iteration 1 — 2026-05-05에 `aggregated_output`가 통째로 `.ralph/errors.log`에 기록된 뒤 다음 이터 프롬프트가 1MB 제한을 초과함
