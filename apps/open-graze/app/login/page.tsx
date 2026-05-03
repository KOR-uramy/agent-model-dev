"use client";

import { AppChrome, AuthCard } from "@/app/components/app-chrome";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-[var(--list-border)] bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted/70 focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600";

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
    <AppChrome active="login">
      <AuthCard>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">로그인</h1>
        <p className="mt-2 text-sm text-muted">
          등록된 이메일과 비밀번호로 대시보드에 들어갑니다.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="시드 계정 비밀번호"
            />
          </div>
          {err ? <p className="text-sm text-red-600 dark:text-red-400">{err}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-cta py-3 text-sm font-semibold text-white transition hover:bg-cta-hover disabled:opacity-60 dark:text-neutral-900"
          >
            {pending ? "확인 중…" : "로그인"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted">
          로컬 시드:{" "}
          <code className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] dark:bg-neutral-900">
            dev@opengraze.local
          </code>{" "}
          ·{" "}
          <code className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] dark:bg-neutral-900">
            opengraze-dev
          </code>
        </p>

        <p className="mt-8 text-center text-sm text-muted">
          계정이 없나요?{" "}
          <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            가입
          </Link>
        </p>

        <Link href="/" className="mt-6 block text-center text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
          관측 홈으로
        </Link>
      </AuthCard>
    </AppChrome>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AppChrome>
          <div className="p-8 text-center text-sm text-muted">불러오는 중…</div>
        </AppChrome>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
