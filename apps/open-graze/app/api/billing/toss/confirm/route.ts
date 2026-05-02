import { auth } from "@/auth";
import { tossConfirmPayment } from "@/lib/toss-api";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  slug: z.string().min(1),
  orderId: z.string().min(6),
  paymentKey: z.string().min(1),
  amount: z.number().int().positive(),
});

export async function POST(req: Request) {
  const secretKey = process.env.TOSS_SECRET_KEY?.trim();
  if (!secretKey) {
    return NextResponse.json({ error: "TOSS_SECRET_KEY 미설정" }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { slug, orderId, paymentKey, amount } = parsed.data;

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: { members: true },
  });
  if (!workspace) {
    return NextResponse.json({ error: "workspace not found" }, { status: 404 });
  }
  const member = workspace.members.find((m) => m.userId === session.user.id);
  if (!member || member.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const order = await prisma.tossCheckoutOrder.findUnique({
    where: { orderId },
  });
  if (!order || order.workspaceId !== workspace.id) {
    return NextResponse.json({ error: "order mismatch" }, { status: 400 });
  }
  if (order.status === "confirmed") {
    return NextResponse.json({ ok: true, idempotent: true });
  }
  if (order.amountKrw !== amount) {
    return NextResponse.json({ error: "amount mismatch" }, { status: 400 });
  }

  const result = await tossConfirmPayment({
    secretKey,
    paymentKey,
    orderId,
    amount,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "toss_confirm_failed", detail: result.body },
      { status: 502 },
    );
  }

  await prisma.$transaction([
    prisma.tossCheckoutOrder.update({
      where: { id: order.id },
      data: { status: "confirmed" },
    }),
    prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        subscriptionStatus: "active",
        tossLastPaymentKey: paymentKey,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
