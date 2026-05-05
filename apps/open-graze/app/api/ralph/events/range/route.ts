import {
  RALPH_EVENTS_ROLE_QUERY_ERROR,
  RALPH_EVENTS_SOURCE_QUERY_ERROR,
  loadTimelineEventsInRange,
  parseSessionIdQueryParam,
} from "@/lib/timeline-feed";
import { TIMELINE_RANGE_MAX_ROWS } from "@/lib/timeline-constants";
import {
  parseSourceQueryParam,
  parseTimelineRangeParams,
} from "@/lib/timeline-query-params";
import { parseRoleQueryParam } from "ralph-workspace-sdk";
import { NextResponse } from "next/server";

/**
 * 동기화된 Ralph/SQLite 타임라인을 `from`·`to`(ISO 8601)로 잘라 반환합니다.
 * 본문은 **객체**(`events`, `truncated`, `returnedCount`)이며, SQLite `LIMIT`에 닿아도 **항상 HTTP 200**
 * 으로 두고 `truncated: true`로 잘림만 표시합니다(413 등으로 거절하지 않음).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = parseTimelineRangeParams(
    searchParams.get("from"),
    searchParams.get("to"),
  );
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.message }, { status: 400 });
  }
  const roleRaw = searchParams.get("role");
  if (
    roleRaw !== null &&
    roleRaw.trim() !== "" &&
    parseRoleQueryParam(roleRaw) === null
  ) {
    return NextResponse.json(
      { error: RALPH_EVENTS_ROLE_QUERY_ERROR },
      { status: 400 },
    );
  }
  const role = parseRoleQueryParam(roleRaw);
  const sessionId = parseSessionIdQueryParam(searchParams.get("sessionId"));
  const sourceRaw = searchParams.get("source");
  if (
    sourceRaw !== null &&
    sourceRaw.trim() !== "" &&
    parseSourceQueryParam(sourceRaw) === null
  ) {
    return NextResponse.json(
      { error: RALPH_EVENTS_SOURCE_QUERY_ERROR },
      { status: 400 },
    );
  }
  const source = parseSourceQueryParam(sourceRaw);
  const limitRaw = parseInt(searchParams.get("limit") ?? "10000", 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(TIMELINE_RANGE_MAX_ROWS, Math.max(1, limitRaw))
    : TIMELINE_RANGE_MAX_ROWS;
  const { events, truncated } = await loadTimelineEventsInRange(
    parsed.fromIso,
    parsed.toIso,
    limit,
    { role, sessionId, source },
  );
  return NextResponse.json({
    events,
    truncated,
    returnedCount: events.length,
  });
}
