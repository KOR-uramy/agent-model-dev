"use client";

import {
  loadTossPayments,
  type TossPaymentsWidgets,
  type WidgetAgreementWidget,
  type WidgetPaymentMethodWidget,
} from "@tosspayments/tosspayments-sdk";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type PrepareOk = {
  clientKey: string;
  customerKey: string;
  orderId: string;
  amount: number;
  orderName: string;
};

export function TossBillingClient({ baseUrl }: { baseUrl: string }) {
  const { slug } = useParams<{ slug: string }>();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [payReady, setPayReady] = useState(false);
  const prepRef = useRef<PrepareOk | null>(null);
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);
  const paymentMethodWidgetRef = useRef<WidgetPaymentMethodWidget | null>(null);
  const agreementWidgetRef = useRef<WidgetAgreementWidget | null>(null);

  const teardown = useCallback(async () => {
    await paymentMethodWidgetRef.current?.destroy().catch(() => undefined);
    await agreementWidgetRef.current?.destroy().catch(() => undefined);
    paymentMethodWidgetRef.current = null;
    agreementWidgetRef.current = null;
    widgetsRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setErr(null);
      setLoading(true);
      setPayReady(false);
      await teardown();

      const res = await fetch("/api/billing/toss/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const j = (await res.json()) as PrepareOk & { error?: string };
      if (!res.ok) {
        if (!cancelled) {
          setErr(j.error ?? "결제 화면을 준비하지 못했습니다.");
          setLoading(false);
        }
        return;
      }
      prepRef.current = j;

      try {
        const toss = await loadTossPayments(j.clientKey);
        const widgets = toss.widgets({ customerKey: j.customerKey });
        widgetsRef.current = widgets;
        await widgets.setAmount({ currency: "KRW", value: j.amount });
        const pm = await widgets.renderPaymentMethods({
          selector: "#toss-payment-methods",
          variantKey: "DEFAULT",
        });
        paymentMethodWidgetRef.current = pm;
        const ag = await widgets.renderAgreement({
          selector: "#toss-agreement",
          variantKey: "AGREEMENT",
        });
        agreementWidgetRef.current = ag;
        ag.on("agreementStatusChange", (s) => {
          if (!cancelled) setPayReady(s.agreedRequiredTerms);
        });
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "결제 창을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      void teardown();
    };
  }, [slug, teardown]);

  async function pay() {
    const prep = prepRef.current;
    const widgets = widgetsRef.current;
    if (!prep || !widgets) return;
    setErr(null);
    try {
      await widgets.requestPayment({
        orderId: prep.orderId,
        orderName: prep.orderName,
        successUrl: `${baseUrl}/dashboard/${slug}/billing/success`,
        failUrl: `${baseUrl}/dashboard/${slug}/billing/fail`,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "결제를 진행하지 못했습니다.");
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <Link
        href={`/dashboard/${slug}`}
        className="text-xs text-zinc-500 hover:underline"
      >
        워크스페이스로
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">구독 결제 (토스)</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        결제위젯 v2 · 승인은 성공 리다이렉트 후 서버에서 처리합니다.{" "}
        <a
          className="underline"
          href="https://docs.tosspayments.com/guides/v2/get-started/llms-guide"
          target="_blank"
          rel="noreferrer"
        >
          토스 LLMs 가이드
        </a>
      </p>

      {err ? (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {err}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-8 text-sm text-zinc-500">결제 UI 불러오는 중…</p>
      ) : (
        <>
          <div id="toss-payment-methods" className="mt-8" />
          <div id="toss-agreement" className="mt-6" />
          <button
            type="button"
            disabled={!payReady}
            className="mt-8 w-full rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
            onClick={() => void pay()}
          >
            결제하기
          </button>
        </>
      )}
    </div>
  );
}
