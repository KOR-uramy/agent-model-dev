import { loadTimelineFromDb } from "@/lib/timeline-feed";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tail = Math.min(
    5000,
    Math.max(1, parseInt(searchParams.get("tail") || "800", 10) || 800),
  );
  const payload = await loadTimelineFromDb(tail);
  return NextResponse.json(payload);
}
