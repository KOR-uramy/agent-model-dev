import { createHmac } from "node:crypto";

/**
 * 결제위젯 `customerKey` — 워크스페이스별 고정·추측 어려운 값(문서: UUID 등).
 * DB 저장 없이 서버 시크릿으로 파생합니다.
 */
export function tossWidgetCustomerKeyForWorkspace(workspaceId: string): string {
  const pepper =
    process.env.AUTH_SECRET?.trim() ||
    process.env.TOSS_SECRET_KEY?.trim() ||
    "open-graze-toss-customer-dev";
  const h = createHmac("sha256", `${pepper}:toss_widget_customer`)
    .update(workspaceId)
    .digest("hex");
  return `c_${h.slice(0, 40)}`;
}
