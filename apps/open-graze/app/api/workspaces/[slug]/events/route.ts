import { auth } from "@/auth";
import {
  consumeDashboardEventsListToken,
  dashboardEventsRateHeaders,
} from "@/lib/dashboard-events-rate-limit";
import { prisma } from "@/lib/prisma";
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

  const rl = consumeDashboardEventsListToken(
    session.user.id,
    access.workspace.id,
  );
  if (!rl.ok) {
    const headers = dashboardEventsRateHeaders(rl);
    console.warn(
      JSON.stringify({
        event: "dashboard_events_list_rate_limited",
        workspaceId: access.workspace.id,
        userId: session.user.id,
        limit: rl.limit,
        retryAfterSec: rl.retryAfterSec,
      }),
    );
    return NextResponse.json(
      {
        error: "Too many requests",
        code: "rate_limited",
        retryAfterSeconds: rl.retryAfterSec,
        limitPerWindow: rl.limit,
      },
      { status: 429, headers },
    );
  }

  const events = await prisma.ingestedEvent.findMany({
    where: { workspaceId: access.workspace.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, kind: true, payload: true, createdAt: true },
  });

  const listHeaders = dashboardEventsRateHeaders(rl);
  return NextResponse.json(
    {
      events: events.map((e) => ({
        id: e.id,
        kind: e.kind,
        createdAt: e.createdAt,
        data: JSON.parse(e.payload || "{}") as unknown,
      })),
    },
    { headers: listHeaders },
  );
}
