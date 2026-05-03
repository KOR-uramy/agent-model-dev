import {
  RALPH_EVENTS_ROLE_QUERY_ERROR,
  TIMELINE_RANGE_MAX_ROWS,
  loadTimelineEventsInRange,
  parseSessionIdQueryParam,
  parseTimelineRangeParams,
} from "@/lib/timeline-feed";
import { parseRoleQueryParam } from "ralph-workspace-sdk";
import { NextResponse } from "next/server";

/**
 * 동기화된 Ralph/SQLite 타임라인을 `from`·`to`(ISO 8601)로 잘라 반환합니다.
 * 본문은 **객체**이며 이벤트 배열은 `events`이고, 행 상한 도달 시 `truncated: true`입니다.
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
  const limitRaw = parseInt(searchParams.get("limit") ?? "10000", 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(TIMELINE_RANGE_MAX_ROWS, Math.max(1, limitRaw))
    : TIMELINE_RANGE_MAX_ROWS;
  const { events, truncated } = await loadTimelineEventsInRange(
    parsed.fromIso,
    parsed.toIso,
    limit,
    { role, sessionId },
  );
  return NextResponse.json({
    events,
    truncated,
    returnedCount: events.length,
  });
}
