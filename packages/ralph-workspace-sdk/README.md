# ralph-workspace-sdk

Ralph `stream-parser`가 쓰는 **`.ralph/events.jsonl`**을 읽고, Next.js API 한 줄로 붙일 수 있는 **워크스페이스 플랫폼용 SDK**입니다.

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

- `RalphEvent`, `RalphEventsApiPayload` — 프론트와 공유
- `RALPH_ENV_KEYS` — env 키 단일 출처

## 이 모노레포에서 개발

저장소 루트에서:

```bash
npm install
npm run build -w ralph-workspace-sdk
npm run dev -w ralph-log
```
