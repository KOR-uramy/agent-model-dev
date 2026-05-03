"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
        }),
      });
      const j = (await r.json()) as { error?: string | Record<string, string[]> };
      if (!r.ok) {
        const msg =
          typeof j.error === "string"
            ? j.error
            : JSON.stringify(j.error ?? "가입에 실패했습니다.");
        setErr(msg);
        return;
      }
      router.push("/login?registered=1");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">회원가입</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          이메일과 비밀번호로 계정을 만든 뒤 로그인합니다. 비밀번호는 8자 이상이어야 합니다.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-xs font-medium text-zinc-500">
            이름 (선택)
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
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
            비밀번호 (8자 이상)
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        {err ? <p className="text-sm text-red-600 dark:text-red-400">{err}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {pending ? "처리 중…" : "가입하기"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-medium text-zinc-800 underline dark:text-zinc-200">
          로그인
        </Link>
      </p>
      <Link href="/" className="text-center text-sm text-zinc-500 hover:underline">
        홈으로
      </Link>
    </div>
  );
}
