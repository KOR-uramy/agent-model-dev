import { randomBytes } from "node:crypto";
import { auth } from "@/auth";
import { getTossSubscriptionAmountKrw } from "@/lib/toss-config";
import { tossWidgetCustomerKeyForWorkspace } from "@/lib/toss-customer-key";
import { prisma } from "@/lib/prisma";
import { methodNotAllowed } from "@/lib/route-method-not-allowed";
import { requireWorkspaceMember } from "@/lib/workspace-access";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ slug: z.string().min(1) });

function newOrderId(): string {
  const hex = randomBytes(22).toString("hex");
  const id = `og_${hex}`;
  return id.length <= 64 ? id : id.slice(0, 64);
}

export async function GET() {
  return methodNotAllowed("POST");
}

export async function POST(req: Request) {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim();
  const secretKey = process.env.TOSS_SECRET_KEY?.trim();
  if (!clientKey || !secretKey) {
    return NextResponse.json(
      {
        error:
          "토스 미설정 (NEXT_PUBLIC_TOSS_CLIENT_KEY, TOSS_SECRET_KEY). https://docs.tosspayments.com/guides/v2/get-started/llms-guide",
      },
      { status: 503 },
    );
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
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const access = await requireWorkspaceMember(
    parsed.data.slug,
    session.user.id,
  );
  if (!access || access.member.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const amountKrw = getTossSubscriptionAmountKrw();
  const orderId = newOrderId();
  const customerKey = tossWidgetCustomerKeyForWorkspace(access.workspace.id);

  await prisma.tossCheckoutOrder.create({
    data: {
      orderId,
      workspaceId: access.workspace.id,
      amountKrw,
      status: "pending",
    },
  });

  return NextResponse.json({
    clientKey,
    customerKey,
    orderId,
    amount: amountKrw,
    orderName: `OpenGraze 워크스페이스 ${access.workspace.slug} 구독`,
  });
}
