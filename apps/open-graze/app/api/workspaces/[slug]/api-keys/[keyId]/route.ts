import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace-access";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ slug: string; keyId: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug, keyId } = await ctx.params;
  const access = await requireWorkspaceMember(slug, session.user.id);
  if (!access || !["owner", "admin"].includes(access.member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const key = await prisma.apiKey.findFirst({
    where: { id: keyId, workspaceId: access.workspace.id },
  });
  if (!key) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.apiKey.delete({ where: { id: key.id } });
  return NextResponse.json({ ok: true });
}
