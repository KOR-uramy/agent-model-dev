import { prisma } from "@/lib/prisma";
import { digestToken } from "@/lib/tokens";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  kind: z.string().min(1).max(120),
  data: z.record(z.string(), z.unknown()).optional(),
});

/**
 * 외부 앱·브라우저에서 이벤트 수집.
 * `Authorization: Bearer og_live_...`
 */
export async function POST(req: Request) {
  const authz = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(authz.trim());
  if (!m) {
    return NextResponse.json(
      { error: "Missing Authorization: Bearer <token>" },
      { status: 401 },
    );
  }
  const token = m[1].trim();
  const digest = digestToken(token);

  const apiKey = await prisma.apiKey.findUnique({
    where: { tokenDigest: digest },
    include: { workspace: true },
  });
  if (!apiKey) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }),
    prisma.ingestedEvent.create({
      data: {
        workspaceId: apiKey.workspaceId,
        kind: parsed.data.kind,
        payload: JSON.stringify(parsed.data.data ?? {}),
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
