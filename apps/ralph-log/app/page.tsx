"use client";

import { useCallback, useEffect, useState } from "react";
import type { RalphEventsApiPayload } from "ralph-workspace-sdk";

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
};

function fmtUsd(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n < 0.0001 && n > 0
    ? `<$0.0001`
    : `$${n.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
}

function detailPreview(d: Record<string, unknown> | null): string {
  if (!d || typeof d !== "object") return "—";
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">
          Ralph 루프 로그
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          `stream-parser`가 쓰는 추정 토큰(바이트/4)과 단계별 이벤트입니다. 실제
          청구 토큰과 다를 수 있습니다.
        </p>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {data?.error ? (
          <div className="mb-4 rounded-lg border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
            <p className="font-medium">파일을 읽지 못했습니다</p>
            <p className="mt-1 text-amber-200/80">{data.error}</p>
            {data.hint ? (
              <p className="mt-2 text-xs text-amber-200/60">{data.hint}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="워크스페이스"
            value={data?.workspace ?? "—"}
            mono
            small
          />
          <Stat
            label="피크 추정 토큰"
            value={
              data?.summary.peakEstimatedTokens != null
                ? data.summary.peakEstimatedTokens.toLocaleString()
                : "—"
            }
          />
          <Stat
            label="피크 추정 비용"
            value={fmtUsd(data?.summary.peakEstimatedUsd)}
            sub={
              (data?.usdPerMillionEstTokens ?? 0) > 0
                ? `기준: $${data!.usdPerMillionEstTokens}/1M 추정토큰`
                : "`.env.local`에 RALPH_USD_PER_MILLION_EST_TOKENS 설정"
            }
          />
          <Stat
            label="표시 행 수"
            value={String(data?.summary.rowCount ?? 0)}
            sub="4초마다 갱신"
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            지금 새로고침
          </button>
          {loading ? (
            <span className="text-xs text-zinc-500">불러오는 중…</span>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/80 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">시각 (UTC)</th>
                <th className="px-3 py-2 font-medium">반복</th>
                <th className="px-3 py-2 font-medium">종류</th>
                <th className="px-3 py-2 font-medium">추정 토큰</th>
                <th className="px-3 py-2 font-medium">추정 $</th>
                <th className="px-3 py-2 font-medium">컨텍스트 %</th>
                <th className="px-3 py-2 font-medium">요약</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {[...events].reverse().map((e, i) => (
                <tr
                  key={`${e.ts}-${e.kind}-${i}`}
                  className="hover:bg-zinc-900/50"
                >
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-zinc-400">
                    {e.ts}
                  </td>
                  <td className="px-3 py-2 text-zinc-300">{e.iteration}</td>
                  <td className="px-3 py-2 text-zinc-200">
                    {KIND_LABEL[e.kind] ?? e.kind}
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-300">
                    {(e.estimatedTokens ?? 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-400">
                    {fmtUsd(e.estimatedUsd)}
                  </td>
                  <td className="px-3 py-2 text-zinc-400">
                    {e.contextWindowPct != null
                      ? `${e.contextWindowPct}%`
                      : "—"}
                  </td>
                  <td
                    className="max-w-md truncate px-3 py-2 text-zinc-500"
                    title={JSON.stringify(e.detail ?? {})}
                  >
                    {detailPreview(e.detail)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length === 0 && !loading ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              이벤트가 없습니다. Ralph 루프를 실행하면 `.ralph/events.jsonl`에
              기록됩니다.
            </p>
          ) : null}
        </div>

        <p className="mt-6 text-xs text-zinc-600">
          경로: {data?.eventsPath ?? "—"}
        </p>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  mono,
  small,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-1 font-medium text-zinc-100 ${mono ? "font-mono" : ""} ${small ? "break-all text-xs" : "text-sm"}`}
      >
        {value}
      </div>
      {sub ? <div className="mt-1 text-xs text-zinc-500">{sub}</div> : null}
    </div>
  );
}
