import { loadTimelineFromDb } from "@/lib/timeline-feed";
import type { AgentRoleKey } from "ralph-workspace-sdk";
import { NextResponse } from "next/server";

const AGENT_ROLES: readonly AgentRoleKey[] = [
  "planning",
  "design",
  "implementation",
  "test",
] as const;

function parseRoleParam(raw: string | null): AgentRoleKey | undefined {
  if (raw == null || raw === "") return undefined;
  return (AGENT_ROLES as readonly string[]).includes(raw)
    ? (raw as AgentRoleKey)
    : undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tail = Math.min(
    5000,
    Math.max(1, parseInt(searchParams.get("tail") || "800", 10) || 800),
  );
  const roleRaw = searchParams.get("role");
  const role = parseRoleParam(roleRaw);
  if (roleRaw != null && roleRaw !== "" && role === undefined) {
    return NextResponse.json(
      {
        error: "INVALID_ROLE",
        message:
          "role must be one of: planning, design, implementation, test",
      },
      { status: 400 },
    );
  }
  const payload = await loadTimelineFromDb(tail, role ? { role } : undefined);
  return NextResponse.json(payload);
}
