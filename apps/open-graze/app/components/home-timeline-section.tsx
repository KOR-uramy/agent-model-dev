"use client";

import {
  detailPreview,
  durationCell,
  fmtUsd,
  KIND_LABEL,
  ROLE_LABEL_KO,
  shortenPath,
  SOURCE_LABEL_KO,
  RoleTimelineCell,
  volumeCell,
} from "@/app/components/home-feed-support";
import { AGENT_ROLE_KEYS } from "@/lib/timeline-query-params";
import { tableHeaderRow } from "@/lib/ui-tokens";
import Link from "next/link";
import type {
  AgentRoleKey,
  EventSource,
  RalphEventsApiPayload,
  WorkspaceFeedEvent,
} from "ralph-workspace-sdk";

type ApiPayload = RalphEventsApiPayload;

export function HomeTimelineSection({
  data,
  events,
  loading,
  copyDone,
  onCopyViewUrl,
  sessionIdFilter,
  roleFilter,
  sourceFilter,
  sessionSelectChoices,
  sessionManual,
  setSessionManual,
  setSessionIdQuery,
  setRoleQuery,
  setSourceQuery,
  fromDraft,
  toDraft,
  setFromDraft,
  setToDraft,
  applyFromToDraftToUrl,
  clearFromToQuery,
}: {
  data: ApiPayload | null;
  events: WorkspaceFeedEvent[];
  loading: boolean;
  copyDone: boolean;
  onCopyViewUrl: () => void;
  sessionIdFilter: string | null;
  roleFilter: AgentRoleKey | null;
  sourceFilter: EventSource | null;
  sessionSelectChoices: string[];
  sessionManual: string;
  setSessionManual: (v: string) => void;
  setSessionIdQuery: (v: string | null) => void;
  setRoleQuery: (v: AgentRoleKey | null) => void;
  setSourceQuery: (v: EventSource | null) => void;
  fromDraft: string;
  toDraft: string;
  setFromDraft: (v: string) => void;
  setToDraft: (v: string) => void;
  applyFromToDraftToUrl: () => void;
  clearFromToQuery: () => void;
}) {
  return (
    <>
      <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--list-border)] bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 border-b border-[var(--list-border)] px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">활동 타임라인</h2>
            <p className="mt-1 text-xs text-muted">시간은 UTC · 에이전트와 제품 출처를 구분합니다</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void onCopyViewUrl()}
                className="rounded-lg border border-[var(--list-border)] bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                {copyDone ? "복사됨" : "현재 뷰 URL 복사"}
              </button>
              <span className="text-[10px] text-muted">
                주소에 적용 중인 필터(role·sessionId·from·to·source)가 절대 URL로 담깁니다.
              </span>
            </div>
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
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-left sm:max-w-[12rem] sm:flex-initial sm:items-end">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">채널</span>
              <select
                className="w-full min-w-[10.5rem] rounded-lg border border-[var(--list-border)] bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:focus:ring-neutral-500/30"
                value={sourceFilter ?? ""}
                onChange={(ev) => {
                  const v = ev.target.value;
                  setSourceQuery(v === "" ? null : (v as EventSource));
                }}
                aria-label="타임라인 채널(출처) 필터"
              >
                <option value="">전체 채널</option>
                {(Object.keys(SOURCE_LABEL_KO) as EventSource[]).map((key) => (
                  <option key={key} value={key}>
                    {SOURCE_LABEL_KO[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-b border-[var(--list-border)] bg-neutral-50/40 px-5 py-3 dark:bg-neutral-950/20">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            구간 (UTC, ISO 8601) — 비우면 전체 기간
          </span>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <input
              type="text"
              value={fromDraft}
              onChange={(ev) => setFromDraft(ev.target.value)}
              placeholder="from 예: 2026-05-01T00:00:00Z"
              className="min-w-0 flex-1 rounded-lg border border-[var(--list-border)] bg-background px-3 py-2 font-mono text-xs text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:focus:ring-neutral-500/30 sm:max-w-[14rem]"
              aria-label="타임라인 시작 시각 from"
            />
            <input
              type="text"
              value={toDraft}
              onChange={(ev) => setToDraft(ev.target.value)}
              placeholder="to 예: 2026-05-03T23:59:59Z"
              className="min-w-0 flex-1 rounded-lg border border-[var(--list-border)] bg-background px-3 py-2 font-mono text-xs text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:focus:ring-neutral-500/30 sm:max-w-[14rem]"
              aria-label="타임라인 끝 시각 to"
            />
            <button
              type="button"
              className="shrink-0 rounded-lg border border-[var(--list-border)] bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-neutral-50 dark:hover:bg-neutral-900"
              onClick={() => applyFromToDraftToUrl()}
            >
              구간 적용
            </button>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-dashed border-neutral-400 px-3 py-2 text-xs font-semibold text-muted transition hover:border-neutral-500 hover:text-foreground dark:border-neutral-600"
              onClick={() => clearFromToQuery()}
            >
              구간 해제
            </button>
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
    </>
  );
}
