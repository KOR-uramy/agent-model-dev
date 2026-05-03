"use client";

import { AppChrome, AppMain } from "@/app/components/app-chrome";
import {
  btnPrimarySm,
  btnSecondary,
  codeInline,
  inputFieldInline,
  pageTitle,
  proseMutedSm,
  sectionEyebrow,
  surfaceCard,
  tableHeaderRow,
  tableHeaderRowCompact,
  textErrorXs,
} from "@/lib/ui-tokens";
import {
  WORKSPACE_TASK_STATUS_LABEL,
  isWorkspaceTaskStatus,
} from "@/lib/workspace-task-status";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const billingSuccess = searchParams.get("billing") === "success";
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [events, setEvents] = useState<EvRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [keyName, setKeyName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [publicOrigin, setPublicOrigin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [eventsLoadErr, setEventsLoadErr] = useState<string | null>(null);
  const [tasksLoadErr, setTasksLoadErr] = useState<string | null>(null);

  useEffect(() => {
    setPublicOrigin(window.location.origin);
  }, []);

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
      let msg = `수집 목록을 불러오지 못했습니다 (HTTP ${re.status}). ${raw.slice(0, 240)}`;
      if (re.status === 429) {
        try {
          const j = JSON.parse(raw) as { retryAfterSeconds?: number };
          if (typeof j.retryAfterSeconds === "number") {
            msg = `이 화면의 목록 조회가 너무 잦습니다(HTTP 429). 약 ${j.retryAfterSeconds}초 뒤에 새로고침하거나, 자동 새로고침 스크립트의 간격을 늘려 주세요.`;
          }
        } catch {
          /* keep msg */
        }
      }
      setEventsLoadErr(msg);
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
    setCopyHint(null);
    setNewToken(null);
    setCopyHint(null);
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

  async function copyNewTokenOnly() {
    if (!newToken) return;
    try {
      await navigator.clipboard.writeText(newToken);
      setCopyHint("키를 클립보드에 복사했습니다.");
    } catch {
      setCopyHint("복사에 실패했습니다. 아래 텍스트를 직접 선택해 주세요.");
    }
    window.setTimeout(() => setCopyHint(null), 4500);
  }

  async function copyOpenGrazeEnvSnippet() {
    if (!newToken) return;
    const origin =
      publicOrigin || (typeof window !== "undefined" ? window.location.origin : "");
    const snippet = `OPENGRAZE_PLATFORM_URL=${origin}\nOPENGRAZE_PLATFORM_API_KEY=${newToken}\n`;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopyHint(".env 스니펫을 복사했습니다.");
    } catch {
      setCopyHint("복사에 실패했습니다.");
    }
    window.setTimeout(() => setCopyHint(null), 4500);
  }

  return (
    <AppChrome active="dashboard">
      <AppMain wide>
        <div className="flex flex-col gap-6 border-b border-[var(--list-border)] pb-8 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link href="/dashboard" className="text-xs text-muted underline-offset-4 hover:text-foreground hover:underline">
              ← 워크스페이스 목록
            </Link>
            <h1 className={`mt-2 ${pageTitle}`}>{slug}</h1>
            <p className="mt-1 text-sm text-muted">
              이 공간의 <strong className="text-foreground">작업 현황</strong>, API 키, 수집 기록입니다.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href={`/dashboard/${slug}/billing`} className={`${btnSecondary} px-3 py-2 text-center`}>
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

        {billingSuccess ? (
          <p
            className="mt-6 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
            role="status"
          >
            토스 결제가 서버에서 승인되었습니다. 이 워크스페이스는{" "}
            <strong className="font-medium">구독 활성</strong>로 표시됩니다(목록·상단 상태). 월 자동 과금은 없고, 한 번
            승인된 단건 결제입니다 — 자세한 설명은 앱 README「토스페이먼츠 v2 구독(단건) 결제」를 참고하세요.
          </p>
        ) : null}

        {err ? (
          <p className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            {err}
          </p>
        ) : null}

        <section className={`mt-10 ${surfaceCard}`}>
          <h2 className={sectionEyebrow}>작업 현황</h2>
          <p className={proseMutedSm}>
            API로 반영된 제목·설명·상태를 표시합니다(이 화면에서는 편집하지 않음).{" "}
            <strong className="text-foreground">코드만 고친다고 여기가 자동으로 채워지지는 않습니다</strong> — DB에 들어간
            작업만 보입니다. 넣는 방법은 이 앱 <code className={codeInline}>README.md</code>의 워크스페이스 Task API 또는 로컬{" "}
            <code className={codeInline}>npm run db:seed -w open-graze</code> 입니다.
          </p>
          {tasksLoadErr ? (
            <p className={`mt-2 ${textErrorXs}`}>{tasksLoadErr}</p>
          ) : null}
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--list-border)]">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead className={tableHeaderRow}>
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

        <section className={`mt-8 ${surfaceCard}`}>
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
          <div className="mt-4 rounded-xl border border-[var(--list-border)] bg-neutral-50/80 p-4 text-xs leading-relaxed text-muted dark:bg-neutral-950/50">
            <p className="font-semibold text-foreground">운영·남용 방어·관측</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>
                수집 <code className={codeInline}>POST /api/v1/events</code>는 키별 윈도 레이트·본문 상한이 있습니다(
                <code className={codeInline}>INGEST_RATE_LIMIT_PER_WINDOW</code>,{" "}
                <code className={codeInline}>INGEST_RATE_LIMIT_WINDOW_MS</code>,{" "}
                <code className={codeInline}>INGEST_MAX_BODY_BYTES</code>, <code className={codeInline}>0</code>이면 해당
                레이트 비활성). 초과 시 <code className={codeInline}>429</code>·<code className={codeInline}>413</code>과{" "}
                <code className={codeInline}>Retry-After</code>·<code className={codeInline}>X-RateLimit-*</code>를
                확인하세요. 서버 로그에는 <code className={codeInline}>ingest_rate_limited</code> 등 JSON 한 줄이 남을 수
                있습니다.
              </li>
              <li>
                이 페이지의 수집 목록 조회(<code className={codeInline}>GET …/api/workspaces/…/events</code>)는 세션
                사용자·워크스페이스 단위로 별도 레이트가 걸릴 수 있습니다(
                <code className={codeInline}>DASHBOARD_EVENTS_GET_RATE_LIMIT_PER_WINDOW</code>,{" "}
                <code className={codeInline}>DASHBOARD_EVENTS_GET_RATE_LIMIT_WINDOW_MS</code>). 과도한 새로고침·폴링 시
                HTTP <code className={codeInline}>429</code>와 로그{" "}
                <code className={codeInline}>dashboard_events_list_rate_limited</code>가 나올 수 있습니다.
              </li>
              <li>
                배포 환경의 숫자 한도 스냅샷(비밀 없음):{" "}
                <Link
                  href="/api/v1/meta/limits"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  GET /api/v1/meta/limits
                </Link>
              </li>
            </ul>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--list-border)]">
            <table className="w-full min-w-[28rem] border-collapse text-left text-xs">
              <caption className="border-b border-[var(--list-border)] bg-neutral-50/80 px-3 py-2 text-left font-semibold text-foreground dark:bg-neutral-900/50">
                수집 POST 자주 나는 HTTP 코드(플레이북 요약)
              </caption>
              <thead className={tableHeaderRowCompact}>
                <tr>
                  <th className="px-3 py-2">코드</th>
                  <th className="px-3 py-2">의미·조치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--list-border)] text-muted">
                <tr>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-foreground">401</td>
                  <td className="px-3 py-2">
                    Bearer 없음·키 불일치. 대시보드에서 키를 다시 복사했는지, 환경 변수 이름이{" "}
                    <code className={codeInline}>OPENGRAZE_PLATFORM_API_KEY</code> 인지 확인합니다.
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-foreground">400</td>
                  <td className="px-3 py-2">
                    JSON 파싱 실패 또는 <code className={codeInline}>kind</code> 스키마 불일치.{" "}
                    <code className={codeInline}>kind</code>는 1~120자 문자열, <code className={codeInline}>data</code>는
                    객체 권장입니다.
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-foreground">413</td>
                  <td className="px-3 py-2">
                    본문이 <code className={codeInline}>INGEST_MAX_BODY_BYTES</code> 를 초과했습니다. 페이로드를 줄이거나
                    청크 전송을 피합니다.
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-foreground">429</td>
                  <td className="px-3 py-2">
                    키별 레이트 초과. 응답 <code className={codeInline}>retryAfterSeconds</code>·헤더{" "}
                    <code className={codeInline}>Retry-After</code>를 지키고 지수 백오프로 재시도합니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <form onSubmit={createKey} className="mt-4 flex flex-wrap gap-2">
            <input
              className={inputFieldInline}
              placeholder="구분 이름 · 예: 프로덕션 수집"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              required
            />
            <button type="submit" className={btnPrimarySm}>
              새 키 만들기
            </button>
          </form>
          {newToken ? (
            <div className="mt-4 space-y-2 rounded-xl border border-emerald-200/80 bg-emerald-50 p-4 text-xs text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-100">
              <p className="break-all">
                <strong>지금만 표시됩니다.</strong> 복사 후 다른 앱·CI에는{" "}
                <code className="rounded bg-emerald-100/90 px-1 dark:bg-emerald-900/60">OPENGRAZE_PLATFORM_API_KEY</code> 로 저장하고,
                베이스 URL은{" "}
                <code className="rounded bg-emerald-100/90 px-1 dark:bg-emerald-900/60">OPENGRAZE_PLATFORM_URL</code> 에 두면 이 레포의{" "}
                <code className="rounded bg-emerald-100/90 px-1 dark:bg-emerald-900/60">npm run platform:self-test</code> 와 문서 예제가
                그대로 맞습니다. {newToken}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-emerald-300/80 bg-emerald-100/80 px-3 py-1.5 text-[11px] font-medium text-emerald-950 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-50"
                  onClick={() => void copyNewTokenOnly()}
                >
                  키만 복사
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-emerald-300/80 bg-emerald-100/80 px-3 py-1.5 text-[11px] font-medium text-emerald-950 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-50"
                  onClick={() => void copyOpenGrazeEnvSnippet()}
                >
                  .env 스니펫 복사
                </button>
              </div>
              {copyHint ? <p className="text-[11px] text-emerald-900 dark:text-emerald-200">{copyHint}</p> : null}
            </div>
          ) : null}
          <ul className="mt-4 space-y-2 text-sm">
            {keys.map((k) => (
              <li
                key={k.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--list-border)] px-3 py-2.5"
              >
                <span className="min-w-0">
                  <span className="font-medium text-foreground">{k.name}</span>{" "}
                  <code className={codeInline}>{k.prefix}…</code>
                </span>
                <button
                  type="button"
                  className="shrink-0 text-xs text-red-600 underline-offset-4 hover:underline dark:text-red-400"
                  onClick={() => delKey(k.id)}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
          {keys.length === 0 ? (
            <p className="mt-3 text-center text-xs text-muted">아직 발급된 키가 없습니다. 위에서 이름을 넣고 새 키를 만드세요.</p>
          ) : null}
        </section>

        <section className={`mt-8 ${surfaceCard}`}>
          <h2 className={sectionEyebrow}>최근 수집 활동</h2>
          <p className={proseMutedSm}>
            이 워크스페이스로 들어온 <code className={codeInline}>POST /api/v1/events</code> 결과만 보입니다.{" "}
            <strong className="text-foreground">지금 편집 중인 UI·코드 변경은 여기에 나타나지 않습니다.</strong> 아래가{" "}
            <code className={codeInline}>[]</code>이면 아직 이벤트를 한 번도 안 보낸 것이거나, 이 키가 아닌 다른 키로 보냈을 수
            있습니다. 터미널에서 한 번 보낸 뒤 이 페이지를 새로고침해 보세요.
          </p>
          <p className="mt-1 text-xs text-muted">최대 100건까지 표시합니다.</p>
          {eventsLoadErr ? (
            <p className={`mt-2 ${textErrorXs}`}>{eventsLoadErr}</p>
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
            {`POST ${publicOrigin || "<이-브라우저-호스트>"}/api/v1/events
Authorization: Bearer <발급한_키>
Content-Type: application/json

{"kind":"page_view","data":{"path":"/"}}`}
          </pre>
        </section>
      </AppMain>
    </AppChrome>
  );
}
