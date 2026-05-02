import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * `tosspayments-webhook-signature` 검증.
 * @see https://docs.tosspayments.com/reference/using-api/webhook-events
 */
export function verifyTossWebhookSignature(
  rawBody: string,
  transmissionTime: string | null,
  signatureHeader: string | null,
  secretKey: string,
): boolean {
  if (!transmissionTime || !signatureHeader || !secretKey) return false;
  const payload = `${rawBody}:${transmissionTime}`;
  const hmac = createHmac("sha256", secretKey).update(payload).digest();
  const segments = signatureHeader.split(",").map((s) => s.trim());
  for (const seg of segments) {
    if (!seg.startsWith("v1:")) continue;
    const b64 = seg.slice(3);
    try {
      const decoded = Buffer.from(b64, "base64");
      if (decoded.length === hmac.length && timingSafeEqual(decoded, hmac)) {
        return true;
      }
    } catch {
      /* invalid base64 */
    }
  }
  return false;
}
