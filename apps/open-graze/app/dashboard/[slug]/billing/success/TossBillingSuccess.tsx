"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function TossBillingSuccess() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amountRaw = searchParams.get("amount");
    if (!paymentKey || !orderId || !amountRaw) {
      setErr("결제 정보가 URL에 없습니다. 대시보드로 돌아가 주세요.");
      setBusy(false);
      return;
    }
    const amount = parseInt(amountRaw, 10);
    if (!Number.isFinite(amount)) {
      setErr("금액 파라미터가 올바르지 않습니다.");
      setBusy(false);
      return;
    }

    void (async () => {
      const r = await fetch("/api/billing/toss/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, orderId, paymentKey, amount }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        error?: string;
        detail?: string;
      };
      if (!r.ok) {
        setErr(
          typeof j.error === "string"
            ? j.detail
              ? `${j.error}: ${j.detail}`
              : j.error
            : "승인 실패",
        );
        setBusy(false);
        return;
      }
      router.replace(`/dashboard/${slug}?billing=success`);
    })();
  }, [router, searchParams, slug]);

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      {busy && !err ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          서버에서 결제 승인 중입니다…
        </p>
      ) : null}
      {err ? (
        <>
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {err}
          </p>
          <Link
            href={`/dashboard/${slug}/billing`}
            className="mt-6 inline-block text-sm underline"
          >
            결제 페이지로
          </Link>
        </>
      ) : null}
    </div>
  );
}
