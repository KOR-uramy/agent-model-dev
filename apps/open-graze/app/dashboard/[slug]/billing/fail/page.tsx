"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FailInner() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const message = searchParams.get("message");

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <h1 className="text-xl font-semibold">결제 실패</h1>
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        {message ? decodeURIComponent(message) : "결제가 완료되지 않았습니다."}
        {code ? (
          <>
            {" "}
            <span className="text-zinc-400">({code})</span>
          </>
        ) : null}
      </p>
      <Link
        href={`/dashboard/${slug}/billing`}
        className="mt-8 inline-block text-sm underline"
      >
        다시 시도
      </Link>
    </div>
  );
}

export default function TossBillingFailPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm">로딩…</p>}>
      <FailInner />
    </Suspense>
  );
}
