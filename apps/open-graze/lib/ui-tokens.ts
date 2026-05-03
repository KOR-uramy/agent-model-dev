/**
 * 앱 셸 전반에서 쓰는 Tailwind 클래스 문자열.
 * 색·테두리는 globals.css 의미 토큰(--list-border, text-muted 등)과 맞춘다.
 */
export const sectionEyebrow =
  "text-xs font-semibold uppercase tracking-wider text-muted";

export const proseMutedSm = "mt-1 text-xs leading-relaxed text-muted";

export const linkSubtle =
  "text-muted underline-offset-4 hover:text-foreground hover:underline";

export const linkSubtleTight =
  "text-muted underline underline-offset-2 hover:text-foreground";

/** 본문 필드(로그인·가입·대시보드 폼 공통) */
export const inputField =
  "w-full rounded-lg border border-[var(--list-border)] bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted/70 focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600";

/** 가로 폼 줄에서 쓰는 입력(워크스페이스 상세 등) */
export const inputFieldInline = `${inputField} min-w-[12rem] flex-1`;

/** 인라인 코드·환경 변수 표기 */
export const codeInline =
  "rounded-md bg-neutral-100 px-1 py-0.5 font-mono text-[11px] text-foreground dark:bg-neutral-900";

/** 보조 설명 단락(로그인 상단 등) */
export const proseBodyMuted = "mt-2 text-sm text-muted";
