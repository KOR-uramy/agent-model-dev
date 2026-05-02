import { syncJsonlToTimeline } from "@/lib/timeline-feed";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  tail: z.number().int().min(1).max(20_000).optional(),
});

/**
 * `.ralph/events.jsonl` + `workspace-telemetry.jsonl`을 읽어 `TimelineEvent`(SQLite)에 적재.
 * `Authorization: Bearer <RALPH_FEED_SYNC_SECRET>` 필요.
 */
export async function POST(req: Request) {
  const secret = process.env.RALPH_FEED_SYNC_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "RALPH_FEED_SYNC_SECRET 미설정" },
      { status: 503 },
    );
  }
  const authz = req.headers.get("authorization")?.trim() ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(authz);
  if (!m || m[1].trim() !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let tail = 8000;
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      const json: unknown = await req.json();
      const p = bodySchema.safeParse(json);
      if (p.success && p.data.tail != null) tail = p.data.tail;
    } catch {
      /* empty body OK */
    }
  }

  const { inserted, skipped } = await syncJsonlToTimeline(tail);
  return NextResponse.json({ ok: true, inserted, skipped, tail });
}
