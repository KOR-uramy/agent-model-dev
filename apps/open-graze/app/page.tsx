"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { RalphEventsApiPayload, WorkspaceFeedEvent } from "ralph-workspace-sdk";

type ApiPayload = RalphEventsApiPayload;

const KIND_LABEL: Record<string, string> = {
  session_start: "세션 시작",
  model_init: "모델",
  tool_read: "파일 읽기",
  tool_write: "파일 쓰기",
  tool_shell: "쉘",
  token_snapshot: "토큰 스냅샷",
  session_end: "세션 종료",
  api_error: "API 오류",
  api_error_defer: "API 오류(재시도)",
  context_warn: "컨텍스트 경고",
  context_rotate: "컨텍스트 로테이션",
  ralph_complete: "Ralph 완료",
  ralph_gutter_sigil: "Ralph Gutter",
  application_work_started: "앱 작업 시작",
  application_work_completed: "앱 작업 완료",
  application_work_checkpoint: "앱 체크포인트",
  application_metric: "앱 지표",
  git_commit: "Git 커밋",
  telegram_message: "텔레그램 메시지",
  telegram_task: "텔레그램 /task",
};

function fmtUsd(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n < 0.0001 && n > 0
    ? `<$0.0001`
    : `$${n.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
}

function detailPreview(d: Record<string, unknown> | null): string {
  if (!d || typeof d !== "object") return "—";
  if (typeof d.title === "string" && typeof d.workId === "string")
    return `${d.title} (${d.workId})`;
  if (typeof d.title === "string") return d.title;
  if (typeof d.path === "string") return d.path;
  if (typeof d.command === "string")
    return d.command.length > 80 ? `${d.command.slice(0, 80)}…` : d.command;
  if (typeof d.model === "string") return d.model;
  if (typeof d.summary === "string") return d.summary;
  try {
    return JSON.stringify(d);
  } catch {
    return "—";
  }
}

function durationCell(e: WorkspaceFeedEvent): string {
  if (e.source !== "application") return "—";
  const d = e.detail;
  if (!d || typeof d !== "object") return "—";
  if (typeof d.durationMs === "number")
    return `${d.durationMs.toLocaleString()} ms`;
  return "—";
}

function volumeCell(e: WorkspaceFeedEvent): string {
  if (e.source !== "application") return "—";
  const d = e.detail;
  if (!d || typeof d !== "object") return "—";
  if (typeof d.units === "number") {
    const u = d.units.toLocaleString();
    const lab =
      typeof d.unitLabel === "string" && d.unitLabel ? ` ${d.unitLabel}` : "";
    return `${u}${lab}`;
  }
  return "—";
}

function shortenPath(p: string, max = 42): string {
  if (p.length <= max) return p;
  return `…${p.slice(-(max - 1))}`;
}

export default function Home() {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/ralph/events?tail=1200`);
      const j = (await r.json()) as ApiPayload;
      setData(j);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 4000);
    return () => clearInterval(id);
  }, [load]);

  const events = data?.events ?? [];
  const s = data?.summary;
  const timelineEmpty = data?.error === "TIMELINE_EMPTY";
  const headlineMetric =
    s?.rowCount != null && s.rowCount > 0
      ? `${s.rowCount.toLocaleString()} events live`
      : "타임라인 준비됨 · 동기화 대기";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-ring">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <span className="text-sm font-semibold tracking-wide text-muted">
            OpenGraze
          </span>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/login"
              className="rounded-full border border-ring px-4 py-2 text-foreground/90 transition hover:bg-card"
            >
              로그인
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-accent px-4 py-2 font-medium text-white shadow-sm transition hover:bg-accent-hover"
            >
              워크스페이스
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:pt-16">
        <div className="flex flex-col items-center text-center">
          <div
            className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#3d5a4a] via-[#2c4a6e] to-[#c45c3e] text-3xl font-display font-semibold text-white shadow-lg ring-4 ring-white/30 dark:ring-black/20"
            aria-hidden
          >
            OG
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            OpenGraze
          </h1>
          <p className="mt-3 max-w-md text-base text-muted">
            {data?.workspace
              ? shortenPath(data.workspace, 48)
              : "Ralph · 앱 텔레메트리를 한 화면에"}
          </p>
          <p className="mt-4 font-display text-2xl font-medium text-foreground sm:text-3xl">
            {headlineMetric}
          </p>
          {s?.peakEstimatedUsd != null && Number.isFinite(s.peakEstimatedUsd) ? (
            <p className="mt-1 text-sm text-muted">
              피크 추정 비용{" "}
              <span className="font-medium text-foreground">
                {fmtUsd(s.peakEstimatedUsd)}
              </span>
            </p>
          ) : null}
          <p className="mx-auto mt-6 max-w-lg text-pretty text-lg italic leading-relaxed text-foreground/85">
            에이전트 루프와 앱 작업을 같은 타임라인에서 보고, 워크스페이스로
            수집·결제까지 묶습니다.
          </p>
        </div>

        <ul className="mx-auto mt-12 max-w-lg divide-y divide-ring rounded-2xl border border-ring bg-card px-1 shadow-sm dark:shadow-none">
          <PlatformRow
            title="라이브 타임라인"
            meta="SQLite · GET /api/ralph/events"
            hint={`${s?.rowCount ?? 0}행 · 4초 갱신`}
          />
          <PlatformRow
            title="JSONL → DB"
            meta="POST /api/ralph/sync-jsonl"
            hint="Bearer RALPH_FEED_SYNC_SECRET"
          />
          <PlatformRow
            title="팀 & API"
            meta="/dashboard"
            hint="Google 로그인 · API 키 · 수집"
            href="/dashboard"
          />
        </ul>

        <details className="mx-auto mt-8 max-w-lg text-left text-sm text-muted">
          <summary className="cursor-pointer list-none text-center font-medium text-foreground/80 [&::-webkit-details-marker]:hidden">
            <span className="underline decoration-ring underline-offset-4">
              데이터 출처 안내
            </span>
          </summary>
          <ul className="mt-4 space-y-2 rounded-xl border border-ring bg-card/80 p-4 text-left text-muted dark:bg-card/50">
            <li>
              이 화면은 <code className="text-foreground/80">TimelineEvent</code>{" "}
              테이블만 표시합니다. 비어 있으면{" "}
              <code className="text-foreground/80">sync-jsonl</code>로{" "}
              <code className="text-foreground/80">.ralph/*.jsonl</code>을 넣으세요.
            </li>
            <li>
              <strong className="text-foreground/90">/dashboard</strong>는 별도
              SQLite(워크스페이스·수집 이벤트)입니다.
            </li>
          </ul>
        </details>

        {data?.error && events.length === 0 ? (
          <div
            className={
              timelineEmpty
                ? "mx-auto mt-8 max-w-lg rounded-2xl border border-ring bg-card px-5 py-4 text-left text-sm text-muted shadow-sm"
                : "mx-auto mt-8 max-w-lg rounded-2xl border border-amber-900/40 bg-amber-50 px-5 py-4 text-left text-sm text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100"
            }
          >
            <p
              className={
                timelineEmpty
                  ? "font-semibold text-foreground"
                  : "font-semibold text-amber-950 dark:text-amber-50"
              }
            >
              {timelineEmpty
                ? "타임라인이 비어 있습니다"
                : "데이터를 불러오지 못했습니다"}
            </p>
            {!timelineEmpty ? (
              <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
                {data.error}
              </p>
            ) : null}
            {data.hint ? (
              <p
                className={
                  timelineEmpty ? "mt-2 text-xs leading-relaxed" : "mt-2 text-xs"
                }
              >
                {data.hint}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
          <Stat
            label="피크 추정 토큰"
            value={
              s?.peakEstimatedTokens != null
                ? s.peakEstimatedTokens.toLocaleString()
                : "—"
            }
          />
          <Stat label="피크 추정 비용" value={fmtUsd(s?.peakEstimatedUsd)} />
          <Stat
            label="앱 이벤트"
            value={String(s?.applicationEventCount ?? 0)}
            sub="application_*"
          />
          <Stat
            label="누적 작업 시간"
            value={
              s?.totalApplicationDurationMs != null
                ? `${s.totalApplicationDurationMs.toLocaleString()} ms`
                : "—"
            }
          />
          <Stat
            label="누적 작업량"
            value={
              s?.totalApplicationUnits != null
                ? s.totalApplicationUnits.toLocaleString()
                : "—"
            }
            sub="units"
          />
          <Stat label="표시 행" value={String(s?.rowCount ?? 0)} sub="타임라인" />
        </div>

        <div className="mx-auto mt-8 flex max-w-lg justify-center">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-ring px-5 py-2 text-sm font-medium text-foreground transition hover:bg-card"
          >
            지금 새로고침
          </button>
          {loading ? (
            <span className="ml-3 self-center text-xs text-muted">불러오는 중…</span>
          ) : null}
        </div>

        <div className="mx-auto mt-10 overflow-hidden rounded-2xl border border-ring bg-card shadow-md dark:shadow-none">
          <div className="border-b border-ring bg-card px-4 py-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              이벤트 스트림
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              UTC 시각 · Ralph / 앱 출처
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-ring bg-background/60 text-xs font-medium uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-2.5">시각</th>
                  <th className="px-3 py-2.5">출처</th>
                  <th className="px-3 py-2.5">반복</th>
                  <th className="px-3 py-2.5">종류</th>
                  <th className="px-3 py-2.5">작업 시간</th>
                  <th className="px-3 py-2.5">작업량</th>
                  <th className="px-3 py-2.5">토큰</th>
                  <th className="px-3 py-2.5">$</th>
                  <th className="px-3 py-2.5">CTX</th>
                  <th className="px-3 py-2.5">요약</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ring">
                {[...events].reverse().map((e, i) => (
                  <tr
                    key={`${e.ts}-${e.source}-${e.kind}-${i}`}
                    className="transition hover:bg-background/80"
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted">
                      {e.ts}
                    </td>
                    <td className="px-3 py-2.5 text-foreground/90">
                      {e.source === "ralph" ? "Ralph" : "앱"}
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {e.source === "ralph" ? (e.iteration ?? "—") : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-foreground">
                      {KIND_LABEL[e.kind] ?? e.kind}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted">
                      {durationCell(e)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted">
                      {volumeCell(e)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-foreground/90">
                      {e.source === "ralph"
                        ? (e.estimatedTokens ?? 0).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-muted">
                      {e.source === "ralph" ? fmtUsd(e.estimatedUsd) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {e.source === "ralph" && e.contextWindowPct != null
                        ? `${e.contextWindowPct}%`
                        : "—"}
                    </td>
                    <td
                      className="max-w-[14rem] truncate px-3 py-2.5 text-muted"
                      title={JSON.stringify(e.detail ?? {})}
                    >
                      {detailPreview(e.detail)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 && !loading ? (
              <p className="px-6 py-12 text-center text-sm text-muted">
                이벤트가 없습니다. Ralph는{" "}
                <code className="rounded bg-background px-1 text-foreground/80">
                  .ralph/events.jsonl
                </code>
                , 앱은 SDK 로거로 텔레메트리에 남깁니다.
              </p>
            ) : null}
          </div>
        </div>

        <footer className="mx-auto mt-12 max-w-lg border-t border-ring pt-8 text-center text-xs leading-relaxed text-muted">
          <p className="break-all">
            Ralph: {data?.eventsPath ? shortenPath(data.eventsPath, 56) : "—"}
          </p>
          <p className="mt-1 break-all">
            텔레메트리:{" "}
            {data?.telemetryPath ? shortenPath(data.telemetryPath, 56) : "—"}
          </p>
          <p className="mt-6 text-[11px] opacity-70">
            OpenGraze · agent-model-dev 워크스페이스 SDK
          </p>
        </footer>
      </main>
    </div>
  );
}

function PlatformRow({
  title,
  meta,
  hint,
  href,
}: {
  title: string;
  meta: string;
  hint: string;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-lg shadow-inner ring-1 ring-ring">
        {href ? "→" : "·"}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted">{meta}</div>
        <div className="mt-0.5 text-[11px] text-muted/90">{hint}</div>
      </div>
    </>
  );

  const cls =
    "flex items-start gap-4 px-4 py-4 transition hover:bg-background/60";

  if (href) {
    return (
      <li>
        <Link href={href} className={`${cls} block`}>
          {inner}
        </Link>
      </li>
    );
  }
  return <li className={cls}>{inner}</li>;
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-ring bg-card px-4 py-3 shadow-sm dark:shadow-none">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tracking-tight text-foreground">
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-xs text-muted">{sub}</div> : null}
    </div>
  );
}
