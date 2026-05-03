"use client";

import { AppChrome, AuthCard } from "@/app/components/app-chrome";
import { inputField } from "@/lib/ui-tokens";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function RegisterInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const cb = sp.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password !== confirm) {
      setErr("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    setPending(true);
    try {
      const reg = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() || undefined }),
      });
      const j = (await reg.json()) as { error?: string };
      if (!reg.ok) {
        setErr(typeof j.error === "string" ? j.error : "가입에 실패했습니다.");
        return;
      }
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: cb,
      });
      if (res?.error) {
        setErr("가입은 완료되었으나 자동 로그인에 실패했습니다. 로그인 화면에서 다시 시도해 주세요.");
        return;
      }
      router.push(cb);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <AppChrome active="register">
      <AuthCard>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">계정 만들기</h1>
        <p className="mt-2 text-sm text-muted">
          워크스페이스·수집 API를 쓰려면 이메일로 가입한 뒤 대시보드로 이동합니다.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="reg-email" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              이메일
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputField}
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label htmlFor="reg-name" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              표시 이름 <span className="font-normal normal-case text-muted">(선택)</span>
            </label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputField}
              placeholder="예: 운영 대시보드"
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              비밀번호
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputField}
              placeholder="8자 이상"
              minLength={8}
            />
          </div>
          <div>
            <label htmlFor="reg-confirm" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              비밀번호 확인
            </label>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputField}
            />
          </div>
          {err ? <p className="text-sm text-red-600 dark:text-red-400">{err}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-cta py-3 text-sm font-semibold text-white transition hover:bg-cta-hover disabled:opacity-60 dark:text-neutral-900"
          >
            {pending ? "처리 중…" : "가입하고 계속"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            로그인
          </Link>
        </p>
      </AuthCard>
    </AppChrome>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <AppChrome>
          <div className="p-8 text-center text-sm text-muted">불러오는 중…</div>
        </AppChrome>
      }
    >
      <RegisterInner />
    </Suspense>
  );
}
