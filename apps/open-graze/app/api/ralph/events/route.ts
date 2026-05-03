import {
  RALPH_EVENTS_ROLE_QUERY_ERROR,
  RALPH_EVENTS_SOURCE_QUERY_ERROR,
  loadTimelineFromDb,
  parseSessionIdQueryParam,
} from "@/lib/timeline-feed";
import {
  parseRoleQueryParam,
  parseSourceQueryParam,
} from "@/lib/timeline-query-params";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tail = Math.min(
    5000,
    Math.max(1, parseInt(searchParams.get("tail") || "800", 10) || 800),
  );
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
  const payload = await loadTimelineFromDb(tail, role, sessionId, source);
  return NextResponse.json(payload);
}
