import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { methodNotAllowed } from "@/lib/route-method-not-allowed";
import { requireWorkspaceMember } from "@/lib/workspace-access";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ slug: string; taskId: string }> };

const taskStatusZ = z.enum([
  "backlog",
  "todo",
  "in_progress",
  "blocked",
  "done",
]);

const patchSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  description: z.string().trim().max(8000).nullable().optional(),
  status: taskStatusZ.optional(),
});

export async function GET() {
  return methodNotAllowed("PATCH");
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug, taskId } = await ctx.params;
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await prisma.workspaceTask.findFirst({
    where: {
      id: taskId,
      workspaceId: access.workspace.id,
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: {
    title?: string;
    description?: string | null;
    status?: string;
  } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.description !== undefined) {
    data.description =
      parsed.data.description === null || parsed.data.description === ""
        ? null
        : parsed.data.description;
  }
  if (parsed.data.status !== undefined) {
    data.status = parsed.data.status;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  const task = await prisma.workspaceTask.update({
    where: { id: taskId },
    data,
  });

  return NextResponse.json({ task });
}
