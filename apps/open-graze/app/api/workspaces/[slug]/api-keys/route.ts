import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace-access";
import { digestToken, generateApiToken, tokenPrefix } from "@/lib/tokens";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ slug: string }> };

const createSchema = z.object({
  name: z.string().min(1).max(60),
});

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

  const keys = await prisma.apiKey.findMany({
    where: { workspaceId: access.workspace.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return NextResponse.json({ apiKeys: keys });
}

export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  const access = await requireWorkspaceMember(slug, session.user.id);
  if (!access || !["owner", "admin"].includes(access.member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const token = generateApiToken();
  const row = await prisma.apiKey.create({
    data: {
      workspaceId: access.workspace.id,
      name: parsed.data.name,
      prefix: tokenPrefix(token),
      tokenDigest: digestToken(token),
    },
  });

  return NextResponse.json({
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    /** 이 값은 이번 응답에만 표시됩니다. 안전한 곳에 저장하세요. */
    token,
  });
}
