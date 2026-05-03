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
    <AppChrome active="login">
      <AuthCard>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">OpenGraze 로그인</h1>
        <p className="mt-2 text-sm text-muted">
          워크스페이스·API 키·수집 이벤트를 한곳에서 관리합니다. 아래 이메일·비밀번호로 대시보드에 들어갑니다.
        </p>
        {registered ? (
          <p className="mt-3 rounded-lg border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-100">
            가입이 완료되었습니다. 비밀번호를 입력하고 로그인해 주세요.
          </p>
        ) : null}
        <p className="mt-3 text-xs text-muted">
          HTTP 수집 계약 요약은{" "}
          <Link href="/llms.txt" className="font-medium text-foreground underline underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">
            /llms.txt
          </Link>
          , 앱 설치·마이그레이션은 저장소{" "}
          <code className="rounded-md bg-neutral-100 px-1 py-0.5 font-mono text-[11px] text-foreground dark:bg-neutral-900">
            apps/open-graze/README.md
          </code>{" "}
          를 참고하세요.
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

        <p className="mt-6 text-center text-sm text-muted">
          아직 계정이 없나요?{" "}
          <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            회원가입
          </Link>
        </p>

        <div className="mt-6 flex flex-col gap-2 border-t border-[var(--list-border)] pt-6 text-center text-sm text-muted">
          <Link href="/" className="hover:text-foreground hover:underline">
            관측 타임라인(홈)
          </Link>
          <Link href="/dashboard" className="hover:text-foreground hover:underline">
            워크스페이스 목록
          </Link>
        </div>
      </AuthCard>
    </AppChrome>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AppChrome active="login">
          <AuthCard>
            <div className="py-4 text-center text-sm text-muted">불러오는 중…</div>
          </AuthCard>
        </AppChrome>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
