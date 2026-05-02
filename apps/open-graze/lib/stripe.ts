/**
 * 레거시 Stripe 클라이언트. 제품 결제 표준은 토스페이먼츠 v2
 * (`RALPH_TASK.md`, https://docs.tosspayments.com/guides/v2/get-started/llms-guide).
 */
import Stripe from "stripe";

export function getStripe(): Stripe | null {
  const k = process.env.STRIPE_SECRET_KEY?.trim();
  if (!k) return null;
  return new Stripe(k);
}
