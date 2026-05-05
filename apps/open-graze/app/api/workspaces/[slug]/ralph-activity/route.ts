import { auth } from "@/auth";
import {
  readRalphActivityLog,
  readRalphCurrentSession,
} from "@/lib/ralph-activity-log";
import { requireWorkspaceMember } from "@/lib/workspace-access";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await ctx.params;
  const access = await requireWorkspaceMember(slug, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [snapshot, currentSession] = await Promise.all([
    readRalphActivityLog(),
    readRalphCurrentSession(),
  ]);
  return NextResponse.json({ ...snapshot, currentSession });
}
