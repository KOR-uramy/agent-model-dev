"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type KeyRow = { id: string; name: string; prefix: string; createdAt: string };
type EvRow = {
  id: string;
  kind: string;
  createdAt: string;
  data: unknown;
};

export default function WorkspaceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [events, setEvents] = useState<EvRow[]>([]);
  const [keyName, setKeyName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [rk, re] = await Promise.all([
      fetch(`/api/workspaces/${slug}/api-keys`),
      fetch(`/api/workspaces/${slug}/events`),
    ]);
    if (rk.status === 401 || re.status === 401) {
      router.replace("/login");
      return;
    }
    if (rk.ok) {
      const j = (await rk.json()) as { apiKeys: KeyRow[] };
      setKeys(j.apiKeys);
    }
    if (re.ok) {
      const j = (await re.json()) as { events: EvRow[] };
      setEvents(j.events);
    }
  }, [slug, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setNewToken(null);
    const r = await fetch(`/api/workspaces/${slug}/api-keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: keyName }),
    });
    const j = await r.json();
    if (!r.ok) {
      setErr(j.error ?? "키를 만들 수 없습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setNewToken(j.token as string);
    setKeyName("");
    await load();
  }

  async function delKey(id: string) {
    if (!confirm("이 키를 삭제하면 해당 키로는 더 이상 데이터를 보낼 수 없습니다. 삭제할까요?")) return;
    await fetch(`/api/workspaces/${slug}/api-keys/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-xs text-zinc-500 hover:underline">
            워크스페이스 목록
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{slug}</h1>
          <p className="mt-1 text-sm text-zinc-500">이 공간의 API 키와 수집 기록입니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/${slug}/billing`}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            구독 · 결제
          </Link>
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:underline"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            로그아웃
          </button>
        </div>
      </div>

      {err ? (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {err}
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          수집용 API 키
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          앱·스크립트에서 이벤트를 보낼 때 사용합니다. 노출되지 않게 보관하세요.
        </p>
        <form onSubmit={createKey} className="mt-3 flex flex-wrap gap-2">
          <input
            className="min-w-[12rem] flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="구분 이름 · 예: 프로덕션 수집"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            required
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            새 키 만들기
          </button>
        </form>
        {newToken ? (
          <p className="mt-3 break-all rounded-md bg-emerald-50 p-3 text-xs text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100">
            <strong>지금만 표시됩니다.</strong> 안전한 곳에 복사해 두세요. {newToken}
          </p>
        ) : null}
        <ul className="mt-4 space-y-2 text-sm">
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800"
            >
              <span>
                {k.name}{" "}
                <code className="text-xs text-zinc-500">{k.prefix}…</code>
              </span>
              <button
                type="button"
                className="text-xs text-red-600 hover:underline"
                onClick={() => delKey(k.id)}
              >
                삭제하기
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          최근 수집 활동
        </h2>
        <p className="mt-1 text-xs text-zinc-500">최대 100건까지 표시합니다.</p>
        <pre className="mt-3 max-h-80 overflow-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
          {JSON.stringify(events, null, 2)}
        </pre>
      </section>

      <section className="mt-10 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">연동 예시</p>
        <p className="mt-2">
          발급한 키로 HTTPS POST를 보내면 아래 목록에 쌓입니다. 상세 스키마는 개발자 문서를 참고하세요.
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-white p-2 text-[11px] dark:bg-zinc-900">
          {`POST ${typeof window !== "undefined" ? window.location.origin : ""}/api/v1/events
Authorization: Bearer <발급한_키>
Content-Type: application/json

{"kind":"page_view","data":{"path":"/"}}`}
        </pre>
      </section>
    </div>
  );
}
