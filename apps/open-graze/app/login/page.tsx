"use client";

import { AppChrome } from "@/app/components/app-chrome";
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
  const registered = sp.get("registered") === "1";
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
          워크스페이스·API 키·수집 이벤트를 한곳에서 관리합니다. 아래 이메일·비밀번호로 대시보드에 들어갑니다.
        </p>
        {registered ? (
          <p className="mt-2 rounded-lg border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-xs text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-100">
            가입이 완료되었습니다. 같은 비밀번호로 로그인해 주세요.
          </p>
        ) : null}
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
          HTTP 수집 계약 요약은{" "}
          <Link href="/llms.txt" className="underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200" target="_blank" rel="noopener noreferrer">
            /llms.txt
          </Link>
          , 앱 설치·마이그레이션은 저장소{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">apps/open-graze/README.md</code> 를 참고하세요.
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
      </div>

      <div className="flex flex-col gap-2 text-center text-sm text-zinc-500">
        <Link href="/" className="hover:underline">
          타임라인(홈)으로 돌아가기
        </Link>
        <Link href="/dashboard" className="hover:underline">
          대시보드로 이동
        </Link>
      </div>
    </div>
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
