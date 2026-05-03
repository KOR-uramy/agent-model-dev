"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type {
  AgentRoleKey,
  RalphEventsApiPayload,
  WorkspaceFeedEvent,
} from "ralph-workspace-sdk";

type ApiPayload = RalphEventsApiPayload;

/** 이메일 로그인을 숨기려면 `false`로 둔다. */
const SHOW_LOGIN_LINKS = true;

const ROLE_LABEL_KO: Record<AgentRoleKey, string> = {
  planning: "기획",
  design: "디자인",
  implementation: "구현",
  test: "테스트",
};

function roleBadgeClass(role: AgentRoleKey): string {
  const base =
    "inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ring-1";
  switch (role) {
    case "planning":
      return `${base} bg-slate-100 text-slate-800 ring-slate-200 dark:bg-slate-900/50 dark:text-slate-200 dark:ring-slate-700`;
    case "design":
      return `${base} bg-violet-100 text-violet-900 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-100 dark:ring-violet-800`;
    case "implementation":
      return `${base} bg-emerald-100 text-emerald-900 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800`;
    case "test":
      return `${base} bg-amber-100 text-amber-950 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800`;
  }
}

function parseDetailRole(d: Record<string, unknown> | null): AgentRoleKey | null {
  if (!d || typeof d !== "object") return null;
  const r = d.role;
  if (r === "planning" || r === "design" || r === "implementation" || r === "test") return r;
  return null;
}

function RoleTimelineCell({ detail }: { detail: WorkspaceFeedEvent["detail"] }) {
  const role = parseDetailRole(detail);
  if (!role) return <span className="text-muted">—</span>;
  return (
    <span className={roleBadgeClass(role)} title={role}>
      {ROLE_LABEL_KO[role]}
    </span>
  );
}

const KIND_LABEL: Record<string, string> = {
  session_start: "세션 시작",
  model_init: "모델 초기화",
  tool_read: "파일 조회",
  tool_write: "파일 저장",
  tool_shell: "명령 실행",
  token_snapshot: "토큰 스냅샷",
  session_end: "세션 종료",
  api_error: "모델 오류",
  api_error_defer: "모델 오류(재시도)",
  context_warn: "컨텍스트 부족 경고",
  context_rotate: "컨텍스트 전환",
  ralph_complete: "에이전트 라운드 완료",
  ralph_gutter_sigil: "내부 마커",
  application_work_started: "제품 작업 시작",
  application_work_completed: "제품 작업 완료",
  application_work_checkpoint: "제품 체크포인트",
  application_metric: "제품 지표",
  git_commit: "커밋 기록",
  telegram_message: "텔레그램 알림",
  telegram_task: "텔레그램 작업",
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
      ? `표시 중인 활동 ${s.rowCount.toLocaleString()}건`
      : "아직 표시된 활동이 없어요";

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="sticky top-0 z-20 border-b border-[var(--list-border)] bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight text-foreground"
          >
            OpenGraze
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm sm:gap-x-5">
            <span className="text-muted max-sm:hidden">관측</span>
            <Link href="/dashboard" className="text-muted underline-offset-4 hover:text-foreground hover:underline">
              대시보드
            </Link>
            {SHOW_LOGIN_LINKS ? (
              <>
                <Link href="/login" className="text-muted underline-offset-4 hover:text-foreground hover:underline">
                  로그인
                </Link>
                <Link href="/register" className="text-muted underline-offset-4 hover:text-foreground hover:underline">
                  가입
                </Link>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 pb-24 pt-14 sm:max-w-lg sm:pt-20">
        {/* Hero — Indie-style narrow column, serif name + sans metric */}
        <div className="flex flex-col items-center text-center">
          <div
            className="mb-8 h-[5.5rem] w-[5.5rem] overflow-hidden rounded-full bg-neutral-200 ring-1 ring-neutral-300 dark:bg-neutral-800 dark:ring-neutral-700"
            aria-hidden
          >
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-600 font-display text-2xl font-medium text-white dark:from-neutral-200 dark:to-neutral-400 dark:text-neutral-900">
              OG
            </div>
          </div>

          <h1 className="font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            OpenGraze
          </h1>

          <p className="mt-4 text-base font-medium text-muted">
            {data?.workspace ? shortenPath(data.workspace, 44) : "에이전트 · 제품 활동을 한눈에"}
          </p>

          <p className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
            {headlineMetric}
          </p>

          {s?.peakEstimatedUsd != null && Number.isFinite(s.peakEstimatedUsd) ? (
            <p className="mt-2 text-sm text-muted">
              구간 기준 최대 추정 비용{" "}
              <span className="font-medium text-foreground">{fmtUsd(s.peakEstimatedUsd)}</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">몇 초마다 자동으로 새로고침됩니다</p>
          )}

          <p className="mx-auto mt-8 max-w-[22rem] text-pretty text-[1.05rem] italic leading-relaxed text-neutral-600 dark:text-neutral-400">
            반복되는 에이전트 실행과 실제 서비스 동작을 같은 줄에서 추적하고, 워크스페이스에서 수집과 결제까지 이어집니다.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-cta px-8 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover dark:text-neutral-900"
            >
              대시보드 열기
            </Link>
            {SHOW_LOGIN_LINKS ? (
              <Link
                href="/login"
                className="rounded-full border border-neutral-300 px-8 py-3 text-sm font-semibold text-foreground transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                로그인
              </Link>
            ) : null}
          </div>
        </div>

        {/* Product-style rows — logo tile + title + right rail */}
        <ul className="mx-auto mt-16 space-y-0 border-y border-[var(--list-border)]">
          <PlatformRow
            emoji="📡"
            title="실시간 활동 피드"
            meta="에이전트 루프와 연결된 제품에서 올라온 이벤트를 이 화면에 모읍니다."
            rail={`${s?.rowCount ?? 0}건`}
          />
          <PlatformRow
            emoji="📥"
            title="로컬 로그 반영"
            meta="데스크톱·CI에 남은 로그를 서비스 타임라인으로 가져올 때 사용합니다."
            rail="연동"
          />
          <PlatformRow
            emoji="👥"
            title="워크스페이스 · 수집 API"
            meta="계정으로 들어가 키를 발급하고 수집 기록을 확인합니다."
            rail="이동"
            href="/dashboard"
          />
        </ul>

        <details className="mx-auto mt-10 text-center text-sm text-muted">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="underline decoration-neutral-300 underline-offset-[6px] dark:decoration-neutral-600">
              이 화면은 무엇을 보여 주나요?
            </span>
          </summary>
          <div className="mt-4 rounded-xl border border-[var(--list-border)] bg-card p-4 text-left text-sm leading-relaxed text-muted">
            <p>
              지금 보시는 목록은 OpenGraze에 저장된{" "}
              <strong className="text-foreground">활동 타임라인</strong>입니다. 아직 비어 있다면 로컬 환경에서 쌓인 로그가 서비스로 아직 들어오지 않은 상태일 수 있습니다.
            </p>
            <p className="mt-3">
              <strong className="text-foreground">대시보드</strong>에서는 워크스페이스별 API 키와 외부에서 보낸 수집
              이벤트를 따로 다룹니다.
            </p>
          </div>
        </details>

        {data?.error && events.length === 0 ? (
          <div
            className={
              timelineEmpty
                ? "mx-auto mt-8 rounded-xl border border-[var(--list-border)] bg-card px-5 py-4 text-left text-sm text-muted"
                : "mx-auto mt-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-left text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100"
            }
          >
            <p className={timelineEmpty ? "font-semibold text-foreground" : "font-semibold"}>
              {timelineEmpty
                ? "표시할 활동이 아직 없어요"
                : "화면을 불러오지 못했습니다"}
            </p>
            {!timelineEmpty && data.error ? (
              <p className="mt-1 text-xs opacity-80">코드: {data.error}</p>
            ) : null}
            {data.hint ? <p className="mt-2 text-sm leading-relaxed opacity-90">{data.hint}</p> : null}
          </div>
        ) : null}

        <details className="mx-auto mt-12">
          <summary className="cursor-pointer list-none text-center text-sm font-medium text-muted [&::-webkit-details-marker]:hidden">
            <span className="underline decoration-neutral-300 underline-offset-[6px] dark:decoration-neutral-600">
              요약 지표 보기
            </span>
          </summary>
          <div className="mx-auto mt-4 grid max-w-3xl gap-2 sm:grid-cols-2">
            <Stat label="추정 토큰 (피크)" value={s?.peakEstimatedTokens != null ? s.peakEstimatedTokens.toLocaleString() : "—"} />
            <Stat label="추정 비용 (피크)" value={fmtUsd(s?.peakEstimatedUsd)} />
            <Stat label="제품 이벤트 수" value={String(s?.applicationEventCount ?? 0)} sub="앱·서비스에서 보고된 건수" />
            <Stat
              label="누적 처리 시간"
              value={
                s?.totalApplicationDurationMs != null
                  ? `${s.totalApplicationDurationMs.toLocaleString()} ms`
                  : "—"
              }
            />
            <Stat
              label="누적 처리량"
              value={s?.totalApplicationUnits != null ? s.totalApplicationUnits.toLocaleString() : "—"}
              sub="보고된 단위 합계"
            />
            <Stat label="표시 중인 행" value={String(s?.rowCount ?? 0)} sub="현재 타임라인" />
          </div>
        </details>

        <div className="mx-auto mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => void load()}
            className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            새로 고침
          </button>
          {loading ? <span className="ml-3 text-xs text-muted">불러오는 중…</span> : null}
        </div>

        <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-xl border border-[var(--list-border)] bg-card">
          <div className="border-b border-[var(--list-border)] px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-foreground">활동 타임라인</h2>
            <p className="mt-1 text-xs text-muted">시간은 UTC · 에이전트와 제품 출처를 구분합니다</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-[var(--list-border)] bg-neutral-50/80 text-[11px] font-medium uppercase tracking-wide text-muted dark:bg-neutral-900/50">
                <tr>
                  <th className="px-3 py-3">시각</th>
                  <th className="px-3 py-3">채널</th>
                  <th className="min-w-[5.5rem] px-3 py-3">역할</th>
                  <th className="px-3 py-3">반복</th>
                  <th className="px-3 py-3">유형</th>
                  <th className="px-3 py-3">소요</th>
                  <th className="px-3 py-3">처리량</th>
                  <th className="px-3 py-3">추정 토큰</th>
                  <th className="px-3 py-3">추정 $</th>
                  <th className="px-3 py-3">컨텍스트</th>
                  <th className="px-3 py-3">메모</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--list-border)]">
                {[...events].reverse().map((e, i) => (
                  <tr key={`${e.ts}-${e.source}-${e.kind}-${i}`} className="transition hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40">
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted">{e.ts}</td>
                    <td className="px-3 py-2.5">{e.source === "ralph" ? "에이전트" : "제품"}</td>
                    <td className="px-3 py-2.5 align-middle">
                      <RoleTimelineCell detail={e.detail} />
                    </td>
                    <td className="px-3 py-2.5 text-muted">{e.source === "ralph" ? (e.iteration ?? "—") : "—"}</td>
                    <td className="px-3 py-2.5">{KIND_LABEL[e.kind] ?? e.kind}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted">{durationCell(e)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted">{volumeCell(e)}</td>
                    <td className="px-3 py-2.5 font-mono text-sm">
                      {e.source === "ralph" ? (e.estimatedTokens ?? 0).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted">
                      {e.source === "ralph" ? fmtUsd(e.estimatedUsd) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {e.source === "ralph" && e.contextWindowPct != null ? `${e.contextWindowPct}%` : "—"}
                    </td>
                    <td className="max-w-[14rem] truncate px-3 py-2.5 text-muted" title={JSON.stringify(e.detail ?? {})}>
                      {detailPreview(e.detail)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 && !loading ? (
              <p className="px-6 py-14 text-center text-sm leading-relaxed text-muted">
                아직 기록이 없습니다. 에이전트나 연결된 제품에서 활동이 전달되면 여기에 나타납니다.
              </p>
            ) : null}
          </div>
        </div>

        <footer className="mx-auto mt-16 max-w-lg border-t border-[var(--list-border)] pt-10 text-center text-[11px] leading-relaxed text-muted">
          <p className="break-all">
            에이전트 로그 연결: {data?.eventsPath ? shortenPath(data.eventsPath, 52) : "—"}
          </p>
          <p className="mt-1 break-all">
            제품 텔레메트리 연결: {data?.telemetryPath ? shortenPath(data.telemetryPath, 52) : "—"}
          </p>
          <p className="mt-8 text-neutral-400 dark:text-neutral-600">OpenGraze · 관측 허브</p>
        </footer>
      </main>
    </div>
  );
}

function PlatformRow({
  emoji,
  title,
  meta,
  rail,
  href,
}: {
  emoji: string;
  title: string;
  meta: string;
  rail: string;
  href?: string;
}) {
  const rowInner = (
    <>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xl dark:bg-neutral-900">
        <span aria-hidden>{emoji}</span>
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="font-semibold text-foreground">{title}</span>
          <span className="text-sm tabular-nums text-muted">{rail}</span>
        </div>
        <p className="mt-1 text-sm leading-snug text-muted">{meta}</p>
      </div>
    </>
  );

  const cls =
    "flex items-start gap-4 border-b border-[var(--list-border)] px-1 py-6 transition last:border-b-0 hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30";

  if (href) {
    return (
      <li>
        <Link href={href} className={`${cls} block`}>
          {rowInner}
        </Link>
      </li>
    );
  }
  return <li className={cls}>{rowInner}</li>;
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-[var(--list-border)] bg-background px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 text-base font-semibold tabular-nums text-foreground">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-muted">{sub}</div> : null}
    </div>
  );
}
