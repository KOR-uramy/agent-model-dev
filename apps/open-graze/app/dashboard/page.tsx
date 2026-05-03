"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Ws = {
  id: string;
  name: string;
  slug: string;
  role: string;
  subscriptionStatus: string;
};

function subscriptionStatusLabel(raw: string): string {
  if (raw === "active") return "구독 활성";
  if (raw === "inactive") return "구독 비활성";
  return raw;
}

export default function DashboardIndexPage() {
  const router = useRouter();
  const [list, setList] = useState<Ws[] | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/workspaces");
    if (r.status === 401) {
      router.replace("/login?callbackUrl=/dashboard");
      return;
    }
    const j = (await r.json()) as { workspaces: Ws[] };
    setList(j.workspaces);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const r = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slug.toLowerCase().trim() }),
    });
    const j = await r.json();
    if (!r.ok) {
      setErr(typeof j.error === "string" ? j.error : JSON.stringify(j.error));
      return;
    }
    setName("");
    setSlug("");
    await load();
    router.push(`/dashboard/${j.workspace.slug}`);
  }

  if (list === null) {
    return (
      <div className="p-8 text-sm text-zinc-500">워크스페이스 목록을 불러오는 중입니다…</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold">워크스페이스</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        프로젝트나 팀마다 공간을 나누고, 수집 API·구독·멤버를 함께 관리합니다.
      </p>

      <form onSubmit={create} className="mt-8 space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-medium">새 워크스페이스 만들기</h2>
        <input
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="표시 이름 · 예: 프로덕션 모니터링"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="주소에 쓰는 ID · 소문자, 숫자, 하이픈만 · 예: acme-prod"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
        {err ? <p className="text-xs text-red-600">{err}</p> : null}
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
        >
          만들기
        </button>
      </form>

      <ul className="mt-10 space-y-2">
        {list.map((w) => (
          <li key={w.id}>
            <Link
              href={`/dashboard/${w.slug}`}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
            >
              <span className="font-medium">{w.name}</span>
              <span className="text-zinc-500">
                {w.slug} · {subscriptionStatusLabel(w.subscriptionStatus)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
