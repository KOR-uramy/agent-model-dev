# ralph-workspace-sdk

Ralph `stream-parser`의 **`.ralph/events.jsonl`**과, 앱이 남기는 **`.ralph/workspace-telemetry.jsonl`**을 합쳐 읽습니다. Next.js(OpenGraze) API 한 줄·**작업 로거**로 **워크스페이스 플랫폼**에 붙일 수 있습니다.

**역할 메타** — 병합 행(`WorkspaceFeedEvent`)의 `detail`이 객체일 때 **선택** 필드 **`role`**(문서상 경로 **`detail.role`**)에 `planning` \| `design` \| `implementation` \| `test` 만 허용. `session_start`는 루프가 `RALPH_ROLE`을 줄 때만 기록한다. 앱 텔레메트리에도 동일 키를 선택적으로 넣을 수 있다(`RALPH_TASK.md`).

## 앱에서 작업 내역·시간·작업량 기록 → OpenGraze에서 확인

1. **같은 `RALPH_WORKSPACE`**를 가리키게 하면(에이전트 Ralph 루트 = 로그 저장 루트), OpenGraze가 한 화면에 합쳐서 보여 줍니다.
2. 서버 코드에서 `createApplicationLogger`로 시작/완료/지표를 남깁니다.

| 변수 | 설명 |
|------|------|
| `OPENGRAZE_TELEMETRY_JSONL` | (선택) 앱 로그 JSONL 경로 — 기본은 `<RALPH_WORKSPACE>/.ralph/workspace-telemetry.jsonl` |
| `OPENGRAZE_WORKSPACE_KEY` | (선택) 멀티 앱·테넌트 구분 문자열(각 이벤트에 `workspaceKey`로 저장) |

```ts
import { createApplicationLogger } from "ralph-workspace-sdk";

const log = createApplicationLogger({
  env: process.env,
  cwd: process.cwd(),
  defaultWorkspaceSegments: ["..", ".."],
});

await log.startWork({ workId: "ingest-42", title: "문서 적재" });
const t0 = Date.now();
// … 작업 …
await log.completeWork({
  workId: "ingest-42",
  title: "문서 적재",
  durationMs: Date.now() - t0,
  units: 120,
  unitLabel: "행",
});
await log.metric({
  units: 1,
  unitLabel: "배치",
  notes: "nightly",
});
```

저수준으로 한 줄만 쓰려면 `appendWorkspaceTelemetryEvent`를 사용합니다. `console.log(opengrazeEnvTemplate())`으로 env 예시를 볼 수 있습니다.

### Git 커밋마다 자동 기록(콜백 / 훅)

직접 `completeWork`를 호출하지 않고, **커밋이 만들어질 때마다** 한 줄 남기려면 `post-commit` 훅에서 CLI를 부르면 됩니다. 패키지 설치 후 `node_modules/.bin`에 **`openg-graze-git-commit`** 이 생깁니다(워크스페이스 루트에서 `npm install` 한 경우).

```sh
# 저장소 루트 — 한 번만
printf '%s\n' '#!/bin/sh' 'npx openg-graze-git-commit' > .git/hooks/post-commit
chmod +x .git/hooks/post-commit
```

모노레포 루트에서만 훅을 쓰고, 로그는 **다른 디렉터리**의 `.ralph`에 두고 싶다면 훅 안에서 `export RALPH_WORKSPACE=/절대/경로` 를 먼저 두면 됩니다.

기록되는 `kind`는 `git_commit`이며, `detail.metadata`에 `sha`, `author`, `branch`가 들어갑니다.

### 텔레그램 알림(선택)

| 변수 | 설명 |
|------|------|
| `TELEGRAM_BOT_TOKEN` | BotFather 토큰 |
| `TELEGRAM_CHAT_ID` | 알림을 받을 채팅 ID(개인/그룹) |
| `TELEGRAM_NOTIFY_COMMITS` | `1`이면 `post-commit` 직후 위 채팅에 커밋 한 줄 요약(HTML) 전송 |

`sendTelegramMessage` / `sendTelegramToChat`를 코드에서 직접 써도 됩니다. 채팅→수집 파이프는 OpenGraze 앱의 `POST /api/webhooks/telegram`과 `apps/open-graze/README.md`를 참고하세요.

## 다른 저장소(새 워크스페이스)에 붙이기

### 1) 환경 변수 (Ralph 쪽과 이름 통일)

| 변수 | 설명 |
|------|------|
| `RALPH_WORKSPACE` | `.ralph`가 있는 Git 루트 **절대 경로** (가장 확실) |
| `RALPH_EVENTS_JSONL` | (선택) `events.jsonl` 직접 경로 — `stream-parser`와 동일 |
| `RALPH_USD_PER_MILLION_EST_TOKENS` | (선택) 추정 토큰 100만당 USD |

`stream-parser.sh`는 이미 `RALPH_EVENTS_JSONL`을 지원합니다. Next 앱만 다른 디렉터리에 있으면 **`RALPH_WORKSPACE`만 꼭** 주면 됩니다.

### 2) Next.js — API 라우트 한 파일

```bash
npm install ralph-workspace-sdk
```

**이 저장소를 그대로 참조할 때** (아직 npm에 안 올린 경우):

```json
"dependencies": {
  "ralph-workspace-sdk": "file:../agent-model-dev/packages/ralph-workspace-sdk"
}
```

(`../...` 경로는 자신의 레포 기준으로 조정.) `npm install` 시 패키지 `prepare`가 `dist/`를 빌드합니다.

`app/api/ralph/events/route.ts`:

```ts
import { createRalphEventsGETHandler } from "ralph-workspace-sdk/next";

export const GET = createRalphEventsGETHandler({
  // RALPH_WORKSPACE 없을 때: process.cwd() 기준 상대 경로로 Ralph 루트 추정
  defaultWorkspaceSegments: ["..", ".."],
  missingFileHint: "RALPH_WORKSPACE를 Ralph 저장소 루트로 설정하세요.",
});
```

`GET /api/ralph/events?tail=800` → `RalphEventsApiPayload` JSON.

핸들러는 `NextResponse.json` 대신 **`Response.json`** 을 쓴다. Next dev(Turbopack)가 패키지 CJS 출력의 `next/server` import를 깨뜨려 `ReferenceError: server_1 is not defined` 가 나는 경우를 피하기 위함이다.

**이 모노레포의 OpenGraze**는 위 핸들러 대신 SQLite에서 읽고, `loadRalphEventsSnapshot` + `buildRalphEventsApiPayloadFromMerged`로 JSONL을 DB에 넣는 경로를 씁니다(`apps/open-graze/README.md`).

### 3) Node 스크립트 / 서버만

```ts
import {
  loadRalphEventsSnapshot,
  RALPH_ENV_KEYS,
  ralphEnvTemplate,
} from "ralph-workspace-sdk";

const data = await loadRalphEventsSnapshot({
  env: process.env,
  cwd: process.cwd(),
  defaultWorkspaceSegments: ["..", ".."],
  tail: 500,
});

console.log(ralphEnvTemplate()); // .env 예시 한 줄들
```

### 타입

- `WorkspaceFeedEvent`, `RalphEventsApiPayload` — 프론트와 공유(행마다 `source`: `ralph` \| `application`)
- `RALPH_ENV_KEYS`, `OPENGRAZE_ENV_KEYS` — env 키 단일 출처

## 이 모노레포에서 개발

저장소 루트에서:

```bash
npm install
npm run build -w ralph-workspace-sdk
npm run dev -w open-graze
```
