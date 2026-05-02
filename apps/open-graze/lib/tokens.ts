import { createHash, randomBytes } from "crypto";

/** 전체 토큰 한 번만 보여 주고 DB에는 SHA-256만 저장 */
export function generateApiToken(): string {
  return `og_live_${randomBytes(32).toString("hex")}`;
}

export function digestToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function tokenPrefix(token: string): string {
  return token.slice(0, 16);
}
