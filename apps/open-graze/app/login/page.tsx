"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const cb = sp.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("dev@opengraze.local");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: cb,
      });
      if (res?.error) {
        setErr("이메일 또는 비밀번호가 맞지 않습니다.");
        return;
      }
      router.push(cb);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">OpenGraze 로그인</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          등록된 이메일과 비밀번호로 대시보드에 들어갑니다.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-xs font-medium text-zinc-500">
            이메일
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-xs font-medium text-zinc-500">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="시드 계정 비밀번호"
          />
        </div>
        {err ? <p className="text-sm text-red-600 dark:text-red-400">{err}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {pending ? "확인 중…" : "로그인"}
        </button>
      </form>

      <p className="text-center text-xs text-zinc-500">
        로컬 기본 계정은 <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">dev@opengraze.local</code> · 시드
        비밀번호 <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">opengraze-dev</code>
      </p>

      <Link href="/" className="text-center text-sm text-zinc-500 hover:underline">
        홈으로 돌아가기
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center text-sm text-zinc-500">불러오는 중…</div>}
    >
      <LoginInner />
    </Suspense>
  );
}
