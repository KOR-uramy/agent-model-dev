import type { AgentRoleKey } from "ralph-workspace-sdk";

/**
 * 앱 셸 전반에서 쓰는 Tailwind 클래스 문자열.
 * 색·테두리·반지름·그림자는 globals.css 의미 토큰과 맞춘다.
 */
export const sectionEyebrow =
  "text-xs font-semibold uppercase tracking-wider text-muted";

export const proseMutedSm = "mt-1 text-xs leading-relaxed text-muted";

export const linkSubtle =
  "text-muted underline-offset-4 hover:text-foreground hover:underline";

export const linkSubtleTight =
  "text-muted underline underline-offset-2 hover:text-foreground";

/** 폼 라벨(로그인·가입·인라인 폼 공통) */
export const formLabel =
  "mb-1 block text-xs font-medium uppercase tracking-wide text-muted";

/** 카드형 섹션(대시보드 폼·설명 블록) — 시각 계층 1단 */
export const surfaceCard =
  "rounded-[var(--radius-xl)] border border-[var(--list-border)] bg-card p-5 shadow-[var(--shadow-card)]";

/** 주요 CTA — 전체 너비 */
export const btnPrimary =
  "w-full rounded-[var(--radius-md)] bg-cta py-3 text-sm font-semibold text-white transition hover:bg-cta-hover disabled:opacity-60 dark:text-neutral-900";

/** 주요 CTA — 인라인(키 발급·워크스페이스 생성 등) */
export const btnPrimarySm =
  "rounded-[var(--radius-md)] bg-cta px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cta-hover dark:text-neutral-900";

export const textError = "text-sm text-red-600 dark:text-red-400";

export const textErrorXs = "text-xs text-red-600 dark:text-red-400";

/** 테이블·타임라인 thead — 배경·구분선 통일 */
export const tableHeaderRow =
  "border-b border-[var(--list-border)] bg-neutral-50/80 text-[11px] font-medium uppercase tracking-wide text-muted dark:bg-neutral-900/50";

/** 보조 표(HTTP 코드 요약 등) thead — 한 단계 낮은 밀도 */
export const tableHeaderRowCompact =
  "border-b border-[var(--list-border)] bg-neutral-50/60 text-[10px] font-medium uppercase tracking-wide text-muted dark:bg-neutral-900/40";

/** details / disclosure 요약 줄 */
export const disclosureSummary =
  "cursor-pointer list-none [&::-webkit-details-marker]:hidden";

/** 본문 필드(로그인·가입·대시보드 폼 공통) */
export const inputField =
  "w-full rounded-[var(--radius-md)] border border-[var(--list-border)] bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted/70 focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600";

/** 가로 폼 줄에서 쓰는 입력(워크스페이스 상세 등) */
export const inputFieldInline = `${inputField} min-w-[12rem] flex-1`;

/** 인라인 코드·환경 변수 표기 */
export const codeInline =
  "rounded-[var(--radius-sm)] bg-neutral-100 px-1 py-0.5 font-mono text-[11px] text-foreground dark:bg-neutral-900";

/** 보조 설명 단락(로그인 상단 등) */
export const proseBodyMuted = "mt-2 text-sm text-muted";

const roleBadgeBase =
  "inline-flex max-w-full items-center truncate rounded-[var(--radius-pill)] px-2 py-0.5 text-[11px] font-semibold tabular-nums ring-1";

/** `/` 타임라인 등 — 역할 배지 색상만 분기 */
export function roleBadgeClass(role: AgentRoleKey): string {
  switch (role) {
    case "planning":
      return `${roleBadgeBase} bg-slate-100 text-slate-800 ring-slate-200 dark:bg-slate-900/50 dark:text-slate-200 dark:ring-slate-700`;
    case "design":
      return `${roleBadgeBase} bg-violet-100 text-violet-900 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-100 dark:ring-violet-800`;
    case "implementation":
      return `${roleBadgeBase} bg-emerald-100 text-emerald-900 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800`;
    case "test":
      return `${roleBadgeBase} bg-amber-100 text-amber-950 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800`;
  }
}
