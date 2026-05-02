/**
 * 레거시 Stripe Webhook. 결제 표준은 토스 v2 — `RALPH_TASK.md`.
 */
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const stripe = getStripe();
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !whSecret) {
    return NextResponse.json({ error: "Stripe webhook 미설정" }, { status: 503 });
  }

  const raw = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const wid = s.metadata?.workspaceId;
    const subId =
      typeof s.subscription === "string"
        ? s.subscription
        : s.subscription && typeof s.subscription === "object"
          ? (s.subscription as Stripe.Subscription).id
          : null;
    if (wid && subId) {
      await prisma.workspace.update({
        where: { id: wid },
        data: {
          stripeCustomerId:
            typeof s.customer === "string"
              ? s.customer
              : s.customer && typeof s.customer === "object"
                ? (s.customer as Stripe.Customer).id
                : undefined,
          stripeSubscriptionId: subId,
          subscriptionStatus: "active",
        },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await prisma.workspace.updateMany({
      where: { stripeSubscriptionId: sub.id },
      data: { subscriptionStatus: "inactive", stripeSubscriptionId: null },
    });
  }

  return NextResponse.json({ received: true });
}
