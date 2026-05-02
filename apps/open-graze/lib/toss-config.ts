/** 토스페이먼츠 v2 코어 API — https://docs.tosspayments.com/reference.md */
export const TOSS_PAYMENTS_CONFIRM_URL =
  "https://api.tosspayments.com/v1/payments/confirm";

const MIN_SUBSCRIPTION_KRW = 100;
const MAX_SUBSCRIPTION_KRW = 50_000_000;

/** 구독(단건 결제) 금액. 테스트 키는 보통 소액으로 검증. */
export function getTossSubscriptionAmountKrw(): number {
  const raw = process.env.TOSS_SUBSCRIPTION_AMOUNT_KRW?.trim();
  if (!raw) return MIN_SUBSCRIPTION_KRW;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return MIN_SUBSCRIPTION_KRW;
  return Math.min(Math.max(n, MIN_SUBSCRIPTION_KRW), MAX_SUBSCRIPTION_KRW);
}
