"use client";

import { roleBadgeClass } from "@/lib/ui-tokens";
import { eventDetailRole } from "@/lib/timeline-query-params";
import Link from "next/link";
import type {
  AgentRoleKey,
  EventSource,
  WorkspaceFeedEvent,
} from "ralph-workspace-sdk";

/** 이메일 로그인을 숨기려면 `false`로 둔다. */
export const SHOW_LOGIN_LINKS = true;

export const ROLE_LABEL_KO: Record<AgentRoleKey, string> = {
  planning: "기획",
  design: "디자인",
  implementation: "구현",
  test: "테스트",
};

export const SOURCE_LABEL_KO: Record<EventSource, string> = {
  ralph: "에이전트만",
  application: "제품만",
};

export const KIND_LABEL: Record<string, string> = {
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

export function RoleTimelineCell({
  detail,
}: {
  detail: WorkspaceFeedEvent["detail"];
}) {
  const role = eventDetailRole(detail);
  if (!role) return <span className="text-muted">—</span>;
  return (
    <span className={roleBadgeClass(role)} title={role}>
      {ROLE_LABEL_KO[role]}
    </span>
  );
}

export function fmtUsd(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n < 0.0001 && n > 0
    ? `<$0.0001`
    : `$${n.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
}

export function detailPreview(d: Record<string, unknown> | null): string {
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

export function durationCell(e: WorkspaceFeedEvent): string {
  if (e.source !== "application") return "—";
  const d = e.detail;
  if (!d || typeof d !== "object") return "—";
  if (typeof d.durationMs === "number")
    return `${d.durationMs.toLocaleString()} ms`;
  return "—";
}

export function volumeCell(e: WorkspaceFeedEvent): string {
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

export function shortenPath(p: string, max = 42): string {
  if (p.length <= max) return p;
  return `…${p.slice(-(max - 1))}`;
}

export function PlatformRow({
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

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--list-border)] bg-background px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold tabular-nums text-foreground">
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-xs text-muted">{sub}</div> : null}
    </div>
  );
}
