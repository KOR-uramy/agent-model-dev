import { headers } from "next/headers";
import { TossBillingClient } from "./TossBillingClient";

export default async function TossBillingPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const envBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const baseUrl =
    envBase ?? (host ? `${proto}://${host}` : "http://localhost:3000");

  return <TossBillingClient baseUrl={baseUrl} />;
}
