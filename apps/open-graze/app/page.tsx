"use client";

import { AppChrome } from "@/app/components/app-chrome";
import { disclosureSummary, roleBadgeClass, tableHeaderRow } from "@/lib/ui-tokens";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { buildApiPayloadFromMetaAndRangeEvents } from "@/lib/timeline-client-payload";
import { TIMELINE_RANGE_MAX_ROWS } from "@/lib/timeline-constants";
import {
  AGENT_ROLE_KEYS,
  EVENT_SOURCE_KEYS,
  eventDetailRole,
  parseRoleQueryParam,
  parseSessionIdQueryParam,
  parseSourceQueryParam,
} from "@/lib/timeline-query-params";
import type {
  AgentRoleKey,
  EventSource,
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

const SOURCE_LABEL_KO: Record<EventSource, string> = {
  ralph: "에이전트",
  application: "제품",
};

function RoleTimelineCell({ detail }: { detail: WorkspaceFeedEvent["detail"] }) {
  const role = eventDetailRole(detail);
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

export default function HomePage() {
  return (
    <Suspense fallback={<HomeLoadingFallback />}>
      <Home />
    </Suspense>
  );
}

function HomeLoadingFallback() {
  return (
    <AppChrome active="home">
      <main className="mx-auto max-w-xl px-5 pb-24 pt-14 sm:max-w-lg sm:pt-20">
        <p className="text-center text-sm text-muted">불러오는 중…</p>
      </main>
    </AppChrome>
  );
}

function Home() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const roleFilter = useMemo(
    () => parseRoleQueryParam(searchParams.get("role")),
    [searchParams],
  );

  const sessionIdFilter = useMemo(
    () => parseSessionIdQueryParam(searchParams.get("sessionId")),
    [searchParams],
  );

  const sourceFilter = useMemo(
    () => parseSourceQueryParam(searchParams.get("source")),
    [searchParams],
  );

  /** `role` 키는 있으나 API와 동일 규칙으로 인정되지 않는 값이면 주소에서 제거한다. */
  useEffect(() => {
    const raw = searchParams.get("role");
    if (raw === null) return;
    if (parseRoleQueryParam(raw) !== null) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("role");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
  }, [pathname, router, searchParams]);

  /** `sessionId` 키만 있고 값이 공백뿐이면 API와 같게 필터 없음으로 보고 키를 제거한다. */
  useEffect(() => {
    const raw = searchParams.get("sessionId");
    if (raw === null) return;
    if (parseSessionIdQueryParam(raw) !== null) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("sessionId");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
  }, [pathname, router, searchParams]);

  /** `source` 키는 있으나 API와 동일 규칙으로 인정되지 않는 값이면 주소에서 제거한다. */
  useEffect(() => {
    const raw = searchParams.get("source");
    if (raw === null) return;
    if (parseSourceQueryParam(raw) !== null) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("source");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
  }, [pathname, router, searchParams]);

  const setRoleQuery = useCallback(
    (role: AgentRoleKey | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (role == null) next.delete("role");
      else next.set("role", role);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setSessionIdQuery = useCallback(
    (sessionId: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      const trimmed = sessionId?.trim() ?? "";
      if (trimmed === "") next.delete("sessionId");
      else next.set("sessionId", trimmed);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setSourceQuery = useCallback(
    (src: EventSource | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (src == null) next.delete("source");
      else next.set("source", src);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [knownSessionIds, setKnownSessionIds] = useState<string[]>([]);
  const [sessionManual, setSessionManual] = useState("");

  const sessionSelectChoices = useMemo(() => {
    const s = new Set(knownSessionIds);
    if (sessionIdFilter) s.add(sessionIdFilter);
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [knownSessionIds, sessionIdFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ tail: "1200" });
      if (roleFilter) qs.set("role", roleFilter);
      if (sessionIdFilter) qs.set("sessionId", sessionIdFilter);
      if (sourceFilter) qs.set("source", sourceFilter);
      const r = await fetch(`/api/ralph/events?${qs.toString()}`);
      const j = (await r.json()) as ApiPayload;
      setData(j);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, sessionIdFilter, sourceFilter]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 4000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (sessionIdFilter != null) return;
    if (!data?.events) return;
    const ids = new Set<string>();
    for (const e of data.events) {
      if (typeof e.sessionId === "string" && e.sessionId.trim() !== "") {
        ids.add(e.sessionId);
      }
    }
    setKnownSessionIds([...ids].sort((a, b) => a.localeCompare(b)));
  }, [data, sessionIdFilter]);

  const events = data?.events ?? [];
  const s = data?.summary;
  const timelineEmpty = data?.error === "TIMELINE_EMPTY";
  const headlineMetric =
    s?.rowCount != null && s.rowCount > 0
      ? `표시 중인 활동 ${s.rowCount.toLocaleString()}건`
      : "아직 표시된 활동이 없어요";

  return (
    <AppChrome active="home">
      <main className="mx-auto max-w-xl px-5 pb-24 pt-14 sm:max-w-lg sm:pt-20">
        {/* Hero — Indie-style narrow column, serif name + sans metric */}
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
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

          <p className="mt-3 max-w-[30rem] text-pretty text-sm leading-snug text-muted sm:text-[0.95rem]">
            챗 로그·APM 대시보드를 오가며 맞춰 보지 않고,{" "}
            <strong className="font-medium text-foreground">역할·추정 비용·제품 이벤트</strong>를 한 타임라인에서 재현합니다.
            수집·연동 계약은{" "}
            <Link
              href="/llms.txt"
              className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              /llms.txt
            </Link>
            로 공개해 두었고, 리포지토리의{" "}
            <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">apps/open-graze/README.md</code> 한 블록으로
            핵심 플로를 재현할 수 있습니다.
          </p>

          <p className="mt-4 max-w-[26rem] text-pretty text-base font-medium leading-snug text-muted">
            {data?.workspace
              ? shortenPath(data.workspace, 44)
              : "운영·구매 담당자도 읽을 수 있게: 에이전트 루프와 제품이 같은 타임라인에 남습니다."}
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

          <p className="mt-6 max-w-[28rem] text-pretty text-center text-xs leading-relaxed text-muted">
            <strong className="font-medium text-foreground">신뢰</strong> — 이메일·비밀번호(Credentials·JWT), 워크스페이스별 API 키, 수집 API 남용 완화.
            운영·구매 담당자에게는 위 공개 계약과{" "}
            <Link
              href="/llms.txt"
              className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              HTTP 수집 요약
            </Link>
            을 먼저 보여 주세요.
          </p>

          <p className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted">
            <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 dark:border-neutral-700">몇 초마다 자동 갱신</span>
            <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 dark:border-neutral-700">역할 배지·토큰·$ 추정</span>
            <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 dark:border-neutral-700">공개 수집 스키마</span>
            <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 dark:border-neutral-700">도그푸드 self-test</span>
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {SHOW_LOGIN_LINKS ? (
              <>
                <Link
                  href="/register"
                  className="rounded-full bg-cta px-8 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover dark:text-neutral-900"
                >
                  무료로 시작하기
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-neutral-300 px-8 py-3 text-sm font-semibold text-foreground transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
                >
                  대시보드 열기
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-neutral-300 px-8 py-3 text-sm font-semibold text-foreground transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
                >
                  이미 계정이 있어요
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="rounded-full bg-cta px-8 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover dark:text-neutral-900"
              >
                대시보드 열기
              </Link>
            )}
            <Link
              href="/llms.txt"
              className="rounded-full border border-dashed border-neutral-400 px-6 py-3 text-sm font-semibold text-muted transition hover:border-neutral-500 hover:text-foreground dark:border-neutral-600 dark:hover:border-neutral-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              HTTP 수집 요약
            </Link>
          </div>

          <ul className="mx-auto mt-10 max-w-md space-y-2 text-left text-sm text-muted">
            <li className="flex gap-2">
              <span className="shrink-0 text-foreground" aria-hidden>
                ·
              </span>
              <span>
                <strong className="text-foreground">역할 구분</strong> — 기획·디자인·구현·테스트가 타임라인 배지로
                구분됩니다.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-foreground" aria-hidden>
                ·
              </span>
              <span>
                <strong className="text-foreground">재현 가능</strong> — 저장소에서{" "}
                <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">platform:self-test</code>로
                수집 파이프를 바로 검증합니다.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-foreground" aria-hidden>
                ·
              </span>
              <span>
                <strong className="text-foreground">문서</strong> — 장문 가이드는 저장소{" "}
                <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">docs/opengraze-llms-guide.md</code>
                , 요약은 위 <strong className="text-foreground">HTTP 수집 요약</strong> 링크(
                <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">/llms.txt</code>)입니다.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-foreground" aria-hidden>
                ·
              </span>
              <span>
                <strong className="text-foreground">전환</strong> — 무료 가입 후 워크스페이스에서 키를 발급하고, 같은 화면에서 수집·과금 흐름을
                이어갑니다.
              </span>
            </li>
          </ul>
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
          <summary className={disclosureSummary}>
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
        ) : data?.hint && !data?.error && events.length === 0 && sessionIdFilter ? (
          <div className="mx-auto mt-8 rounded-xl border border-[var(--list-border)] bg-card px-5 py-4 text-left text-sm text-muted">
            <p className="font-semibold text-foreground">이 세션에는 아직 표시할 행이 없어요</p>
            <p className="mt-2 text-sm leading-relaxed opacity-90">{data.hint}</p>
          </div>
        ) : null}

        <details className="mx-auto mt-12">
          <summary
            className={`${disclosureSummary} text-center text-sm font-medium text-muted`}
          >
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

        <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--list-border)] bg-card shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-3 border-b border-[var(--list-border)] px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">활동 타임라인</h2>
              <p className="mt-1 text-xs text-muted">
                {rangeMode
                  ? "UTC · 주소의 ?from·?to·?role·?sessionId 조합은 GET /api/ralph/events/range 와 동일한 AND 필터입니다"
                  : "시간은 UTC · 에이전트와 제품 출처를 구분합니다 · 최근 tail(내부 고정) 또는 아래 기간 지정"}
              </p>
            </div>
            <div className="flex w-full max-w-xl flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-left sm:max-w-[14rem] sm:flex-initial sm:items-end">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">세션</span>
                <select
                  className="w-full min-w-0 rounded-lg border border-[var(--list-border)] bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:focus:ring-neutral-500/30"
                  value={sessionIdFilter ?? ""}
                  onChange={(ev) => {
                    const v = ev.target.value;
                    setSessionIdQuery(v === "" ? null : v);
                    setSessionManual("");
                  }}
                  aria-label="타임라인 세션 선택"
                >
                  <option value="">전체 세션</option>
                  {sessionSelectChoices.map((sid) => (
                    <option key={sid} value={sid}>
                      {shortenPath(sid, 48)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-[18rem] sm:flex-initial">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted sm:text-right">
                  세션 ID 직접 입력
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sessionManual}
                    onChange={(ev) => setSessionManual(ev.target.value)}
                    placeholder="동기화된 sessionId"
                    className="min-w-0 flex-1 rounded-lg border border-[var(--list-border)] bg-background px-3 py-2 font-mono text-xs text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:focus:ring-neutral-500/30"
                    aria-label="세션 ID 직접 입력"
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-[var(--list-border)] bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    onClick={() => {
                      const v = sessionManual.trim();
                      setSessionIdQuery(v === "" ? null : v);
                    }}
                  >
                    적용
                  </button>
                </div>
              </div>
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-left sm:max-w-[12rem] sm:flex-initial sm:items-end">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">역할 필터</span>
                <select
                  className="w-full min-w-[10.5rem] rounded-lg border border-[var(--list-border)] bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:focus:ring-neutral-500/30"
                  value={roleFilter ?? ""}
                  onChange={(ev) => {
                    const v = ev.target.value;
                    setRoleQuery(v === "" ? null : (v as AgentRoleKey));
                  }}
                  aria-label="타임라인 역할 필터"
                >
                  <option value="">전체 (모든 역할)</option>
                  {AGENT_ROLE_KEYS.map((key: AgentRoleKey) => (
                    <option key={key} value={key}>
                      {ROLE_LABEL_KO[key]}만
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-left sm:max-w-[11rem] sm:flex-initial sm:items-end">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">출처</span>
                <select
                  className="w-full min-w-[9.5rem] rounded-lg border border-[var(--list-border)] bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:focus:ring-neutral-500/30"
                  value={sourceFilter ?? ""}
                  onChange={(ev) => {
                    const v = ev.target.value;
                    setSourceQuery(v === "" ? null : (v as EventSource));
                  }}
                  aria-label="타임라인 출처 필터"
                >
                  <option value="">전체 출처</option>
                  {EVENT_SOURCE_KEYS.map((key: EventSource) => (
                    <option key={key} value={key}>
                      {SOURCE_LABEL_KO[key]}만
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex w-full flex-col gap-2 border-t border-[var(--list-border)] pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  시간 구간 (UTC, ISO 8601)
                </span>
                <span
                  className={
                    rangeMode
                      ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
                      : "rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] text-muted dark:border-neutral-700"
                  }
                >
                  {rangeMode ? "기간 모드 · /api/ralph/events/range" : "최근 모드 · /api/ralph/events?tail=1200"}
                </span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-[min(100%,22rem)]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">from</span>
                  <input
                    type="text"
                    value={rangeDraftFrom}
                    onChange={(ev) => setRangeDraftFrom(ev.target.value)}
                    placeholder="2026-05-01T00:00:00.000Z"
                    className="w-full min-w-0 rounded-lg border border-[var(--list-border)] bg-background px-3 py-2 font-mono text-xs text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:focus:ring-neutral-500/30"
                    aria-label="기간 시작 from (ISO 8601 UTC)"
                    spellCheck={false}
                  />
                </label>
                <label className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-[min(100%,22rem)]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">to</span>
                  <input
                    type="text"
                    value={rangeDraftTo}
                    onChange={(ev) => setRangeDraftTo(ev.target.value)}
                    placeholder="2026-05-03T23:59:59.999Z"
                    className="w-full min-w-0 rounded-lg border border-[var(--list-border)] bg-background px-3 py-2 font-mono text-xs text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:focus:ring-neutral-500/30"
                    aria-label="기간 끝 to (ISO 8601 UTC)"
                    spellCheck={false}
                  />
                </label>
                <button
                  type="button"
                  className="shrink-0 rounded-lg border border-[var(--list-border)] bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  onClick={() => {
                    const p = parseTimelineRangeParams(
                      rangeDraftFrom.trim() || null,
                      rangeDraftTo.trim() || null,
                    );
                    if (!p.ok) return;
                    setFromToQuery(p.fromIso, p.toIso);
                  }}
                >
                  구간 적용
                </button>
                <button
                  type="button"
                  className="shrink-0 rounded-lg border border-[var(--list-border)] bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  onClick={() => {
                    const to = new Date();
                    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
                    setFromToQuery(from.toISOString(), to.toISOString());
                  }}
                >
                  지난 24시간
                </button>
                <button
                  type="button"
                  className="shrink-0 rounded-lg border border-[var(--list-border)] bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  onClick={() => {
                    const to = new Date();
                    const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
                    setFromToQuery(from.toISOString(), to.toISOString());
                  }}
                >
                  지난 7일
                </button>
                <button
                  type="button"
                  className="shrink-0 rounded-lg border border-dashed border-neutral-400 px-3 py-2 text-xs font-semibold text-muted transition hover:border-neutral-500 hover:text-foreground dark:border-neutral-600"
                  onClick={() => setFromToQuery(null, null)}
                >
                  최근만 보기
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className={tableHeaderRow}>
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
                {data?.hint && !data?.error
                  ? data.hint
                  : "아직 기록이 없습니다. 에이전트나 연결된 제품에서 활동이 전달되면 여기에 나타납니다."}
              </p>
            ) : null}
          </div>
        </div>

        <footer className="mx-auto mt-16 max-w-lg border-t border-[var(--list-border)] pt-10 text-center text-[11px] leading-relaxed text-muted">
          <p className="text-[12px] font-medium text-foreground">신뢰·연동·시작</p>
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link href="/llms.txt" className="underline underline-offset-4 hover:text-foreground" target="_blank" rel="noopener noreferrer">
              /llms.txt
            </Link>
            <span aria-hidden className="text-neutral-300 dark:text-neutral-600">
              |
            </span>
            <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
              로그인
            </Link>
            <span aria-hidden className="text-neutral-300 dark:text-neutral-600">
              |
            </span>
            <Link href="/dashboard" className="underline underline-offset-4 hover:text-foreground">
              워크스페이스
            </Link>
            <span aria-hidden className="text-neutral-300 dark:text-neutral-600">
              |
            </span>
            <Link href="/register" className="underline underline-offset-4 hover:text-foreground">
              무료 가입
            </Link>
          </p>
          <p className="mt-6 break-all">
            에이전트 로그 연결: {data?.eventsPath ? shortenPath(data.eventsPath, 52) : "—"}
          </p>
          <p className="mt-1 break-all">
            제품 텔레메트리 연결: {data?.telemetryPath ? shortenPath(data.telemetryPath, 52) : "—"}
          </p>
          <p className="mt-8 text-neutral-400 dark:text-neutral-600">OpenGraze · 관측 허브</p>
        </footer>
      </main>
    </AppChrome>
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
