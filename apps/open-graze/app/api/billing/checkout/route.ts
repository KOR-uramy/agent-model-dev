/**
 * 레거시 Stripe Checkout. 결제 표준은 토스 v2 — `RALPH_TASK.md`.
 */
import { auth } from "@/auth";
import { getStripe } from "@/lib/stripe";
import { methodNotAllowed } from "@/lib/route-method-not-allowed";
import { requireWorkspaceMember } from "@/lib/workspace-access";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ slug: z.string().min(1) });

export async function GET() {
  return methodNotAllowed("POST");
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const access = await requireWorkspaceMember(
    parsed.data.slug,
    session.user.id,
  );
  if (!access || access.member.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID?.trim();
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

  if (!stripe || !priceId) {
    return NextResponse.json(
      { error: "Stripe 미설정 (STRIPE_SECRET_KEY, STRIPE_PRICE_ID)" },
      { status: 503 },
    );
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: session.user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/dashboard/${access.workspace.slug}?billing=success`,
    cancel_url: `${base}/dashboard/${access.workspace.slug}?billing=cancel`,
    metadata: {
      workspaceId: access.workspace.id,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ url: checkout.url });
}
