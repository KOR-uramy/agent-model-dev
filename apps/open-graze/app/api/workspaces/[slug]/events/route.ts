import { auth } from "@/auth";
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

  const events = await prisma.ingestedEvent.findMany({
    where: { workspaceId: access.workspace.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, kind: true, payload: true, createdAt: true },
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      kind: e.kind,
      createdAt: e.createdAt,
      data: JSON.parse(e.payload || "{}") as unknown,
    })),
  });
}
