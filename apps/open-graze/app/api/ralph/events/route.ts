import { loadTimelineFromDb } from "@/lib/timeline-feed";
import { parseRoleQueryParam } from "ralph-workspace-sdk";
import { NextResponse } from "next/server";

function parseSessionIdQueryParam(raw: string | null): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  return t === "" ? null : t;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tail = Math.min(
    5000,
    Math.max(1, parseInt(searchParams.get("tail") || "800", 10) || 800),
  );
  const role = parseRoleQueryParam(searchParams.get("role"));
  const sessionId = parseSessionIdQueryParam(searchParams.get("sessionId"));
  const payload = await loadTimelineFromDb(tail, role, sessionId);
  return NextResponse.json(payload);
}
