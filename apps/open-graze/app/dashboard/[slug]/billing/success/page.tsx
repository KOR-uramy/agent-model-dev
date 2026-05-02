import { Suspense } from "react";
import { TossBillingSuccess } from "./TossBillingSuccess";

export default function TossBillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-lg px-6 py-10 text-sm text-zinc-500">
          승인 처리 중…
        </p>
      }
    >
      <TossBillingSuccess />
    </Suspense>
  );
}
