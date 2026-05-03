import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace-access";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ slug: string }> };

const taskStatusZ = z.enum([
  "backlog",
  "todo",
  "in_progress",
  "blocked",
  "done",
]);

const createSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(8000).optional(),
  status: taskStatusZ.optional(),
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

  const tasks = await prisma.workspaceTask.findMany({
    where: { workspaceId: access.workspace.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      createdById: true,
    },
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  const access = await requireWorkspaceMember(slug, session.user.id);
  if (!access) {
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

  const status = parsed.data.status ?? "todo";

  const task = await prisma.workspaceTask.create({
    data: {
      workspaceId: access.workspace.id,
      title: parsed.data.title,
      description: parsed.data.description?.length
        ? parsed.data.description
        : null,
      status,
      createdById: session.user.id,
    },
  });

  return NextResponse.json({ task });
}
