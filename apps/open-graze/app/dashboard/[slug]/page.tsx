"use client";

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

  const load = useCallback(async () => {
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
    }
    if (rt.ok) {
      const j = (await rt.json()) as { tasks: TaskRow[] };
      setTasks(j.tasks);
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
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-xs text-zinc-500 hover:underline">
            워크스페이스 목록
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{slug}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            이 공간의 <strong className="text-zinc-700 dark:text-zinc-300">작업 현황</strong>, API 키, 수집 기록입니다.
          </p>
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
          작업 현황
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          API로 반영된 제목·설명·상태를 표시합니다(이 화면에서는 편집하지 않음). 연동 방법은 이 앱{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">README.md</code>의 워크스페이스 Task API를
          참고하세요. 로컬 시드 시 <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">opengraze-monitoring</code>{" "}
          워크스페이스에 샘플 작업이 들어갈 수 있습니다.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-800">
                <th className="py-2 pr-4 font-medium">제목</th>
                <th className="py-2 pr-4 font-medium">설명</th>
                <th className="py-2 pr-4 font-medium">상태</th>
                <th className="py-2 font-medium">갱신</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="max-w-[14rem] py-2 pr-4 font-medium">{t.title}</td>
                  <td className="max-w-[16rem] truncate py-2 pr-4 text-zinc-600 dark:text-zinc-400">
                    {t.description ?? "—"}
                  </td>
                  <td className="py-2 pr-4 text-zinc-800 dark:text-zinc-200">
                    {taskStatusLabel(t.status)}
                  </td>
                  <td className="whitespace-nowrap py-2 text-xs text-zinc-500">
                    {new Date(t.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 ? (
            <p className="mt-3 text-xs text-zinc-500">
              아직 표시할 작업이 없습니다. API로 작업을 넣거나, 로컬 시드·연동 스크립트를 실행해 보세요.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          수집용 API 키
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          앱·스크립트·서버에서 이 워크스페이스로 <strong className="text-zinc-700 dark:text-zinc-300">이벤트를 넣을 때</strong> 씁니다.{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">POST …/api/v1/events</code> 요청에 헤더{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">Authorization: Bearer &lt;전체 키&gt;</code> 와 JSON
          본문(예: <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">kind</code>,{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">data</code>)을 붙입니다. 성공하면 아래{" "}
          <strong className="text-zinc-700 dark:text-zinc-300">최근 수집 활동</strong>에 보입니다. 키는 노출·커밋하지 말고{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">OPENGRAZE_PLATFORM_API_KEY</code> 같은 환경 변수에만
          두세요.{" "}
          <Link href="/llms.txt" className="text-zinc-700 underline dark:text-zinc-300">
            /llms.txt
          </Link>{" "}
          (짧은 인덱스) · 레포의{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">docs/opengraze-llms-guide.md</code>
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
            <strong>지금만 표시됩니다.</strong> 복사 후 다른 앱·CI에는{" "}
            <code className="rounded bg-emerald-100/80 px-1 dark:bg-emerald-900/50">OPENGRAZE_PLATFORM_API_KEY</code> 로
            저장하고, 베이스 URL은 <code className="rounded bg-emerald-100/80 px-1 dark:bg-emerald-900/50">OPENGRAZE_PLATFORM_URL</code>{" "}
            에 두면 이 레포의 <code className="rounded bg-emerald-100/80 px-1 dark:bg-emerald-900/50">npm run platform:self-test</code> 와
            문서 예제가 그대로 맞습니다. {newToken}
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
          발급한 키로 아래 URL에 본문을 POST하면 수집 목록에 쌓입니다. 타 언어·LLM용 요약은{" "}
          <Link href="/llms.txt" className="text-zinc-800 underline dark:text-zinc-200">
            /llms.txt
          </Link>
          , 장문 가이드는 저장소 <code className="rounded bg-white px-1 dark:bg-zinc-900">docs/opengraze-llms-guide.md</code> 를
          참고하세요.
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
