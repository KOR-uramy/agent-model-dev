import { TOSS_PAYMENTS_CONFIRM_URL } from "@/lib/toss-config";

type ConfirmOk = { ok: true; data: Record<string, unknown> };
type ConfirmErr = { ok: false; status: number; body: string };

export async function tossConfirmPayment(params: {
  secretKey: string;
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<ConfirmOk | ConfirmErr> {
  const encoded = Buffer.from(`${params.secretKey}:`).toString("base64");
  const res = await fetch(TOSS_PAYMENTS_CONFIRM_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentKey: params.paymentKey,
      orderId: params.orderId,
      amount: params.amount,
    }),
  });
  const body = await res.text();
  if (!res.ok) return { ok: false, status: res.status, body };
  try {
    return { ok: true, data: JSON.parse(body) as Record<string, unknown> };
  } catch {
    return { ok: false, status: res.status, body };
  }
}
