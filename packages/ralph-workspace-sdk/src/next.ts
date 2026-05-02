import { NextResponse } from "next/server";
import type { CreateRalphEventsHandlerOptions } from "./types";
import { loadRalphEventsSnapshot } from "./snapshot";

/**
 * Next.js App Router용 `GET` 핸들러 팩토리.
 *
 * @example
 * ```ts
 * // app/api/ralph/events/route.ts
 * import { createRalphEventsGETHandler } from "ralph-workspace-sdk/next";
 *
 * export const GET = createRalphEventsGETHandler({
 *   defaultWorkspaceSegments: ["..", ".."],
 *   missingFileHint: "한글 안내…",
 * });
 * ```
 */
export function createRalphEventsGETHandler(
  opts: CreateRalphEventsHandlerOptions = {},
) {
  const maxTail = opts.maxTail ?? 5000;
  const { maxTail: _omit, ...pathOpts } = opts;

  return async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const tail = Math.min(
      maxTail,
      Math.max(1, parseInt(searchParams.get("tail") || "800", 10) || 800),
    );

    const payload = await loadRalphEventsSnapshot({
      ...pathOpts,
      tail,
    });

    return NextResponse.json(payload);
  };
}
