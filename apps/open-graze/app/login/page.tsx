"use client";

import { AppChrome, AuthCard } from "@/app/components/app-chrome";
import { inputField } from "@/lib/ui-tokens";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

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
        <h1 className={pageTitle}>OpenGraze 로그인</h1>
        <p className={pageLead}>
          대시보드에서 <strong className="font-medium text-foreground">워크스페이스·API 키·수집 이벤트</strong>를 한곳에서 관리합니다.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          HTTP 수집 계약 요약은{" "}
          <Link
            href="/llms.txt"
            className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            /llms.txt
          </Link>
          , 상세 가이드는 저장소{" "}
          <code className="rounded bg-neutral-100 px-1 text-[11px] dark:bg-neutral-800">docs/opengraze-llms-guide.md</code>{" "}
          를 참고하세요. 로컬 앱 설치는 저장소의{" "}
          <code className="rounded bg-neutral-100 px-1 text-[11px] dark:bg-neutral-800">apps/open-graze/README.md</code>{" "}
          를 따릅니다.
        </p>

        {registered ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
            가입이 완료되었습니다. 방금 만든 비밀번호로 로그인해 주세요.
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className={formLabel}>
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputField}
            />
          </div>
          <div>
            <label htmlFor="password" className={formLabel}>
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputField}
              placeholder="시드 계정 비밀번호"
            />
          </div>
          {err ? <p className={textError}>{err}</p> : null}
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? "확인 중…" : "대시보드로 로그인"}
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

        <div className="mt-6 flex flex-col gap-2 border-t border-[var(--list-border)] pt-6 text-center text-sm text-muted">
          <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            계정이 없으면 가입하기
          </Link>
          <Link href="/" className="hover:text-foreground hover:underline">
            타임라인(홈)으로
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
          <div className="p-8 text-center text-sm text-muted">불러오는 중…</div>
        </AppChrome>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
