"use client";

import { AppChrome, AppMain } from "@/app/components/app-chrome";
import {
  codeInline,
  inputFieldInline,
  proseMutedSm,
  sectionEyebrow,
} from "@/lib/ui-tokens";
import {
  WORKSPACE_TASK_STATUS_LABEL,
  isWorkspaceTaskStatus,
} from "@/lib/workspace-task-status";
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
type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function WorkspaceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [events, setEvents] = useState<EvRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [keyName, setKeyName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [eventsLoadErr, setEventsLoadErr] = useState<string | null>(null);
  const [tasksLoadErr, setTasksLoadErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    setEventsLoadErr(null);
    setTasksLoadErr(null);
    const [rk, re, rt] = await Promise.all([
      fetch(`/api/workspaces/${slug}/api-keys`),
      fetch(`/api/workspaces/${slug}/events`),
      fetch(`/api/workspaces/${slug}/tasks`),
    ]);
    if (rk.status === 401 || re.status === 401 || rt.status === 401) {
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
    } else {
      const raw = await re.text();
      setEvents([]);
      setEventsLoadErr(`수집 목록을 불러오지 못했습니다 (HTTP ${re.status}). ${raw.slice(0, 240)}`);
    }
    if (rt.ok) {
      const j = (await rt.json()) as { tasks: TaskRow[] };
      setTasks(j.tasks);
    } else {
      const raw = await rt.text();
      setTasks([]);
      setTasksLoadErr(`작업 목록을 불러오지 못했습니다 (HTTP ${rt.status}). ${raw.slice(0, 240)}`);
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

  function taskStatusLabel(status: string) {
    return isWorkspaceTaskStatus(status)
      ? WORKSPACE_TASK_STATUS_LABEL[status]
      : status;
  }

  return (
    <AppChrome active="dashboard">
      <AppMain wide>
        <div className="flex flex-col gap-6 border-b border-[var(--list-border)] pb-8 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link href="/dashboard" className="text-xs text-muted underline-offset-4 hover:text-foreground hover:underline">
              ← 워크스페이스 목록
            </Link>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">{slug}</h1>
            <p className="mt-1 text-sm text-muted">
              이 공간의 <strong className="text-foreground">작업 현황</strong>, API 키, 수집 기록입니다.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href={`/dashboard/${slug}/billing`}
              className="rounded-lg border border-[var(--list-border)] bg-card px-3 py-2 text-sm font-medium transition hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40"
            >
              구독 · 결제
            </Link>
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              로그아웃
            </button>
          </div>
        </div>

        {err ? (
          <p className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            {err}
          </p>
        ) : null}

        <section className="mt-10 rounded-2xl border border-[var(--list-border)] bg-card p-5 shadow-sm">
          <h2 className={sectionEyebrow}>작업 현황</h2>
          <p className={proseMutedSm}>
            API로 반영된 제목·설명·상태를 표시합니다(이 화면에서는 편집하지 않음).{" "}
            <strong className="text-foreground">코드만 고친다고 여기가 자동으로 채워지지는 않습니다</strong> — DB에 들어간
            작업만 보입니다. 넣는 방법은 이 앱 <code className={codeInline}>README.md</code>의 워크스페이스 Task API 또는 로컬{" "}
            <code className={codeInline}>npm run db:seed -w open-graze</code> 입니다.
          </p>
          {tasksLoadErr ? (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{tasksLoadErr}</p>
          ) : null}
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--list-border)]">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead className="border-b border-[var(--list-border)] bg-neutral-50/80 text-[11px] font-medium uppercase tracking-wide text-muted dark:bg-neutral-900/50">
                <tr>
                  <th className="px-3 py-3 font-medium">제목</th>
                  <th className="px-3 py-3 font-medium">설명</th>
                  <th className="px-3 py-3 font-medium">상태</th>
                  <th className="px-3 py-3 font-medium">갱신</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--list-border)]">
                {tasks.map((t) => (
                  <tr key={t.id} className="transition hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30">
                    <td className="max-w-[14rem] px-3 py-2.5 font-medium text-foreground">{t.title}</td>
                    <td className="max-w-[16rem] truncate px-3 py-2.5 text-muted">{t.description ?? "—"}</td>
                    <td className="px-3 py-2.5 text-foreground">{taskStatusLabel(t.status)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted">
                      {new Date(t.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tasks.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted">
                아직 표시할 작업이 없습니다. API로 작업을 넣거나, 로컬 시드·연동 스크립트를 실행해 보세요.
              </p>
            ) : null}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[var(--list-border)] bg-card p-5 shadow-sm">
          <h2 className={sectionEyebrow}>수집용 API 키</h2>
          <p className={proseMutedSm}>
            앱·스크립트·서버에서 이 워크스페이스로 <strong className="text-foreground">이벤트를 넣을 때</strong> 씁니다.{" "}
            <code className={codeInline}>POST …/api/v1/events</code> 요청에 헤더{" "}
            <code className={codeInline}>Authorization: Bearer &lt;전체 키&gt;</code> 와 JSON 본문(예:{" "}
            <code className={codeInline}>kind</code>, <code className={codeInline}>data</code>)을 붙입니다. 성공하면 아래{" "}
            <strong className="text-foreground">최근 수집 활동</strong>에 보입니다. 키는 노출·커밋하지 말고{" "}
            <code className={codeInline}>OPENGRAZE_PLATFORM_API_KEY</code> 같은 환경 변수에만 두세요.{" "}
            <Link href="/llms.txt" className="font-medium text-foreground underline-offset-4 hover:underline">
              /llms.txt
            </Link>{" "}
            (짧은 인덱스) · 레포의 <code className={codeInline}>docs/opengraze-llms-guide.md</code>
          </p>
          <form onSubmit={createKey} className="mt-4 flex flex-wrap gap-2">
            <input
              className={inputFieldInline}
              placeholder="구분 이름 · 예: 프로덕션 수집"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              required
            />
            <button
              type="submit"
              className="rounded-lg bg-cta px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cta-hover dark:text-neutral-900"
            >
              새 키 만들기
            </button>
          </form>
          {newToken ? (
            <p className="mt-4 break-all rounded-xl border border-emerald-200/80 bg-emerald-50 p-4 text-xs text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-100">
              <strong>지금만 표시됩니다.</strong> 복사 후 다른 앱·CI에는{" "}
              <code className="rounded bg-emerald-100/90 px-1 dark:bg-emerald-900/60">OPENGRAZE_PLATFORM_API_KEY</code> 로 저장하고,
              베이스 URL은{" "}
              <code className="rounded bg-emerald-100/90 px-1 dark:bg-emerald-900/60">OPENGRAZE_PLATFORM_URL</code> 에 두면 이 레포의{" "}
              <code className="rounded bg-emerald-100/90 px-1 dark:bg-emerald-900/60">npm run platform:self-test</code> 와 문서 예제가
              그대로 맞습니다. {newToken}
            </p>
          ) : null}
          <p className="mt-4 rounded-xl border border-[var(--list-border)] bg-surface-subtle px-4 py-3 text-xs leading-relaxed text-muted">
            <span className="font-semibold text-foreground">운영·남용 방어</span> — 키마다 윈도 단위 요청 한도가 걸릴 수 있습니다(기본
            분당 120회·60초 윈도, <code className={codeInline}>INGEST_RATE_LIMIT_PER_WINDOW</code>·
            <code className={codeInline}>INGEST_RATE_LIMIT_WINDOW_MS</code>, <code className={codeInline}>0</code>이면 비활성). 초과 시
            HTTP <code className={codeInline}>429</code>와 본문 <code className={codeInline}>retryAfterSeconds</code>, 헤더{" "}
            <code className={codeInline}>Retry-After</code>·<code className={codeInline}>X-RateLimit-*</code>를 확인하세요. 본문 크기는{" "}
            <code className={codeInline}>INGEST_MAX_BODY_BYTES</code> 상한이 있습니다. 서버 로그에는{" "}
            <code className={codeInline}>ingest_rate_limited</code> 등 JSON 한 줄이 남을 수 있습니다.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {keys.map((k) => (
              <li
                key={k.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--list-border)] px-4 py-3 transition hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30"
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium text-foreground">{k.name}</span>{" "}
                  <code className={codeInline}>{k.prefix}…</code>
                </span>
                <button
                  type="button"
                  className="shrink-0 text-xs text-red-600 hover:underline dark:text-red-400"
                  onClick={() => delKey(k.id)}
                >
                  삭제하기
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-[var(--list-border)] bg-card p-5 shadow-sm">
          <h2 className={sectionEyebrow}>최근 수집 활동</h2>
          <p className={proseMutedSm}>
            이 워크스페이스로 들어온 <code className={codeInline}>POST /api/v1/events</code> 결과만 보입니다.{" "}
            <strong className="text-foreground">지금 편집 중인 UI·코드 변경은 여기에 나타나지 않습니다.</strong> 아래가{" "}
            <code className={codeInline}>[]</code>이면 아직 이벤트를 한 번도 안 보낸 것이거나, 이 키가 아닌 다른 키로 보냈을 수
            있습니다. 터미널에서 한 번 보낸 뒤 이 페이지를 새로고침해 보세요.
          </p>
          <p className="mt-1 text-xs text-muted">최대 100건까지 표시합니다.</p>
          {eventsLoadErr ? (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{eventsLoadErr}</p>
          ) : null}
          <pre className="mt-4 max-h-80 overflow-auto rounded-xl border border-[var(--list-border)] bg-neutral-50/80 p-4 text-xs dark:bg-neutral-950/80">
            {JSON.stringify(events, null, 2)}
          </pre>
        </section>

        <section className="mt-8 rounded-2xl border border-[var(--list-border)] bg-neutral-50/60 p-5 text-xs text-muted dark:bg-neutral-950/40">
          <p className="font-semibold text-foreground">연동 예시</p>
          <p className="mt-2 leading-relaxed">
            발급한 키로 아래 URL에 본문을 POST하면 수집 목록에 쌓입니다. 타 언어·LLM용 요약은{" "}
            <Link href="/llms.txt" className="font-medium text-foreground underline-offset-4 hover:underline">
              /llms.txt
            </Link>
            , 장문 가이드는 저장소 <code className={codeInline}>docs/opengraze-llms-guide.md</code> 를 참고하세요.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-[var(--list-border)] bg-card p-3 font-mono text-[11px] text-foreground">
            {`POST ${typeof window !== "undefined" ? window.location.origin : ""}/api/v1/events
Authorization: Bearer <발급한_키>
Content-Type: application/json

{"kind":"page_view","data":{"path":"/"}}`}
          </pre>
        </section>
      </AppMain>
    </AppChrome>
  );
}
