import { createRalphEventsGETHandler } from "ralph-workspace-sdk/next";

export const GET = createRalphEventsGETHandler({
  defaultWorkspaceSegments: ["..", ".."],
  missingFileHint:
    "`.ralph/events.jsonl`이 없으면 Ralph 루프를 한 번 실행하거나 RALPH_WORKSPACE를 Ralph 저장소 루트(절대 경로)로 지정하세요.",
});
