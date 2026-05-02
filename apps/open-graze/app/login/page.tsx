"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginInner() {
  const sp = useSearchParams();
  const cb = sp.get("callbackUrl") ?? "/dashboard";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">로그인</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Google 계정으로 워크스페이스에 접속합니다.
        </p>
      </div>
      <button
        type="button"
        className="rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        onClick={() => signIn("google", { callbackUrl: cb })}
      >
        Google로 계속하기
      </button>
      <p className="text-xs text-zinc-500">
        동작하려면 서버 `.env`에 `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`이
        필요합니다.
      </p>
      <Link href="/" className="text-center text-sm text-zinc-500 hover:underline">
        ← 홈
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center text-sm text-zinc-500">로딩…</div>}
    >
      <LoginInner />
    </Suspense>
  );
}
