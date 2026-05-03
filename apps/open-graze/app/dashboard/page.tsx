"use client";

import { AppChrome, AppMain } from "@/app/components/app-chrome";
import { btnPrimarySm, inputField, surfaceCard, textErrorXs } from "@/lib/ui-tokens";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
      <AppChrome active="dashboard">
        <AppMain>
          <p className="text-sm text-muted">워크스페이스 목록을 불러오는 중입니다…</p>
        </AppMain>
      </AppChrome>
    );
  }

  return (
    <AppChrome active="dashboard">
      <AppMain>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">워크스페이스</h1>
        <p className="mt-2 text-sm text-muted">
          프로젝트나 팀마다 공간을 나누고, <strong className="font-medium text-foreground">API 키·수집 이벤트·(설정 시) 구독·결제</strong>를 한곳에 묶습니다. 외부 앱은{" "}
          <Link
            href="/llms.txt"
            className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            /llms.txt
          </Link>{" "}
          공개 계약을 따르고, 장문 가이드는 저장소{" "}
          <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">docs/opengraze-llms-guide.md</code>를
          참고하세요.
        </p>

        <form onSubmit={create} className={`mt-8 space-y-4 ${surfaceCard}`}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">새 워크스페이스</h2>
          <input
            className={inputField}
            placeholder="표시 이름 · 예: 프로덕션 모니터링"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className={inputField}
            placeholder="주소 ID · 소문자·숫자·하이픈 · 예: acme-prod"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
          {err ? <p className={textErrorXs}>{err}</p> : null}
          <button type="submit" className={btnPrimarySm}>
            워크스페이스 만들고 계속
          </button>
        </form>

        <ul className="mt-10 space-y-2">
          {list.map((w) => (
            <li key={w.id}>
              <Link
                href={`/dashboard/${w.slug}`}
                className="flex flex-col gap-1 rounded-xl border border-[var(--list-border)] px-4 py-3 text-sm transition hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="font-medium text-foreground">{w.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted sm:text-sm">
                  {w.slug} · {subscriptionStatusLabel(w.subscriptionStatus)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </AppMain>
    </AppChrome>
  );
}
