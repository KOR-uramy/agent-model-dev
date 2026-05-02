/**
 * 토스페이먼츠 v2 웹훅 — https://docs.tosspayments.com/guides/v2/webhook
 * 개발자센터에 `PAYMENT_STATUS_CHANGED` 등록 후 URL: `{APP}/api/webhooks/toss`
 */
import { prisma } from "@/lib/prisma";
import { verifyTossWebhookSignature } from "@/lib/toss-webhook";
import { NextResponse } from "next/server";

function webhookSecret(): string | null {
  return (
    process.env.TOSS_WEBHOOK_SECRET?.trim() ||
    process.env.TOSS_SECRET_KEY?.trim() ||
    null
  );
}

export async function POST(req: Request) {
  const secret = webhookSecret();
  if (!secret) {
    return NextResponse.json({ error: "webhook secret 미설정" }, { status: 503 });
  }

  const raw = await req.text();
  const transmissionTime = req.headers.get("tosspayments-webhook-transmission-time");
  const signature = req.headers.get("tosspayments-webhook-signature");
  if (!verifyTossWebhookSignature(raw, transmissionTime, signature, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (payload.eventType === "PAYMENT_STATUS_CHANGED") {
    const data = payload.data as Record<string, unknown> | undefined;
    const status = data?.status;
    const orderId = typeof data?.orderId === "string" ? data.orderId : null;
    const paymentKey =
      typeof data?.paymentKey === "string" ? data.paymentKey : null;
    if (status === "DONE" && orderId && paymentKey) {
      const order = await prisma.tossCheckoutOrder.findUnique({
        where: { orderId },
      });
      if (order && order.status !== "confirmed") {
        await prisma.$transaction([
          prisma.tossCheckoutOrder.update({
            where: { id: order.id },
            data: { status: "confirmed" },
          }),
          prisma.workspace.update({
            where: { id: order.workspaceId },
            data: {
              subscriptionStatus: "active",
              tossLastPaymentKey: paymentKey,
            },
          }),
        ]);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
