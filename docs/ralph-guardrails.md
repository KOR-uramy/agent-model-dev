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

### Sign: Verify file paths before replaying shell snippets from logs
- **Trigger**: `.ralph/errors.log` 또는 handoff 메모에 있는 `sed`, `cat`, `node require(...)` 같은 명령을 그대로 다시 실행하려 할 때
- **Instruction**: 먼저 `rg --files`나 `find`로 대상 파일이 실제로 존재하는지 확인한다. 추정 파일명(`timeline-sync.ts`처럼)으로 바로 재실행하지 말고, 현재 레포의 실제 경로를 찾은 뒤 후속 재현/수정을 한다.
- **Added after**: Iteration 5 — 2026-05-05에 `apps/open-graze/lib/timeline-sync.ts`를 읽는 재현 명령이 실제 파일 부재로 다시 실패함

### Sign: Sandbox `listen EPERM` is an environment blocker, not a product regression
- **Trigger**: `npm run dev`, `next dev`, `next start`, 또는 그에 의존한 `npm run runtime:smoke`가 `listen EPERM: operation not permitted 0.0.0.0:3000`로 실패할 때
- **Instruction**: 먼저 `npm run build`로 코드 상태를 분리 확인하고, 이어 dev 서버 직접 기동으로 같은 `listen EPERM`가 재현되는지 본다. 동일하면 앱 코드를 임의 수정하지 말고 샌드박스 포트 바인드 제약으로 기록한 뒤, 호스트 터미널/실서버에서 런타임 스모크를 이어받게 인계한다.
- **Added after**: Iteration 7 — 2026-05-05에 `runtime:smoke` 실패를 추적한 결과, `next dev --turbopack` 자체가 샌드박스에서 `listen EPERM`으로 막혀 HTTP 스모크가 불가능했음

### Sign: Do not run multiple Next dev/build jobs against the same app in parallel
- **Trigger**: 같은 `apps/open-graze` 워크트리에서 `npm run dev`, `npm run build`, `npm test`처럼 `next dev`/`next build`를 일으키는 명령 둘 이상을 동시에 돌리려 할 때
- **Instruction**: `next build`가 `.next`를 지우고 다시 만들기 때문에, dev 재현과 compile 검증은 물론 **build 두 개도** 반드시 **직렬**로 실행한다. `listen EPERM` 원인 확인용 `npm run dev`를 먼저 끝내고, 이후 `npm test` 또는 `npm run build`를 **하나씩 단독**으로 돌려 결과를 판정한다.
- **Added after**: Iteration 7 — 2026-05-05에 `npm test`와 `npm run dev` 병렬 실행으로 `.next/server/app/_not-found/page.js.nft.json` ENOENT가 났고, Iteration 8에서는 `npm run build`와 `npm test` 병렬 실행으로 `.next/export/500.html` ENOENT가 재현됨

### Sign: Quote Next App Router paths that contain brackets
- **Trigger**: `apps/open-graze/app/**/[slug]/**` 같은 App Router 경로를 `sed`, `git diff`, `cat` 등 셸 명령에 그대로 넣을 때
- **Instruction**: zsh는 `[]`를 글로브 패턴으로 해석하므로, 이런 경로는 항상 **작은따옴표로 감싸거나** `printf '%q'` 수준으로 이스케이프해서 실행한다. 파일 부재로 오판하지 말고 먼저 셸 글로빙 실패인지 구분한다.
- **Added after**: Iteration 9 — 2026-05-05에 `apps/open-graze/app/api/workspaces/[slug]/ralph-activity/route.ts` / `apps/open-graze/app/dashboard/[slug]/page.tsx` 읽기 재현이 경로 존재 여부와 무관하게 zsh glob 실패로 다시 기록됨

### Sign: Force dynamic for DB/log-backed App Router API handlers
- **Trigger**: `app/api/**/route.ts` 가 Prisma, 로그 파일, 또는 런타임 쿼리 파라미터에 의존하는데 `next build` 후반 `Collecting page data` 에서 `Cannot find module for page: /api/...` 류 오류가 날 때
- **Instruction**: 이런 route handler는 정적 수집 대상이 아니므로 `export const dynamic = "force-dynamic"` 를 명시한다. 특히 `GET /api/ralph/events*`, `POST /api/v1/events` 같은 DB/로그 기반 엔드포인트는 먼저 dynamic 설정 여부를 확인한 뒤 다시 빌드한다.
- **Added after**: Iteration 10 — 2026-05-05에 홈 필터 요약 바 수정 후 재검증 중 `next build` 가 `/api/ralph/events/range`, `/api/v1/events` page-data 수집 단계에서 누락되어 실패했고, dynamic 고정 후 복구됨

### Sign: Runtime smoke can hit transient 500 while `next dev` warms up
- **Trigger**: `npm run runtime:smoke` 첫 호출에서 `/api/v1/meta/limits` 등 API가 500(또는 HTML 에러)로 실패하지만, 같은 서버에 즉시 `curl`하면 정상 응답으로 회복될 때
- **Instruction**: 서버를 다시 띄우거나 코드부터 바꾸지 말고, 먼저 짧은 재시도(수백 ms~1s)를 적용해 워밍업 구간 오탐을 줄인다. 동시에 `next dev`와 `next build` 병렬 실행이 없는지 확인한다.
- **Added after**: Iteration 1 — 2026-05-05 23:30 KST에 `runtime:smoke`가 첫 요청 500 후 즉시 정상화되어 false blocker로 기록됨
