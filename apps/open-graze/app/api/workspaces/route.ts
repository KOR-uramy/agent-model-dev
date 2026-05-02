import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidSlug } from "@/lib/slug";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(2).max(64),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { workspace: { createdAt: "desc" } },
  });

  return NextResponse.json({
    workspaces: rows.map((r) => ({
      id: r.workspace.id,
      name: r.workspace.name,
      slug: r.workspace.slug,
      role: r.role,
      subscriptionStatus: r.workspace.subscriptionStatus,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const { name, slug } = parsed.data;
  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: "slug: 소문자·숫자·하이픈만, 2~64자" },
      { status: 400 },
    );
  }

  try {
    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        ownerId: session.user.id,
        members: {
          create: { userId: session.user.id, role: "owner" },
        },
      },
    });
    return NextResponse.json({ workspace });
  } catch {
    return NextResponse.json(
      { error: "slug이 이미 사용 중이거나 생성에 실패했습니다." },
      { status: 409 },
    );
  }
}
