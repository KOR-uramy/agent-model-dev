import { RALPH_ENV_KEYS } from "./constants";

export type RalphEnv = Record<string, string | undefined>;

export type RalphEventKind =
  | "session_start"
  | "model_init"
  | "tool_read"
  | "tool_write"
  | "tool_shell"
  | "token_snapshot"
  | "session_end"
  | "api_error"
  | "api_error_defer"
  | "context_warn"
  | "context_rotate"
  | "ralph_complete"
  | "ralph_gutter_sigil";

export type RalphTokenBreakdown = {
  readBytes: number;
  writeBytes: number;
  assistantChars: number;
  shellChars: number;
};

export type RalphEvent = {
  ts: string;
  kind: string;
  iteration: number;
  sessionId: string;
  estimatedTokens: number;
  contextWindowPct: number;
  rotateThreshold: number;
  tokenBreakdown: RalphTokenBreakdown;
  detail: Record<string, unknown> | null;
  estimatedUsd?: number;
};

export type RalphEventsSummary = {
  rowCount: number;
  peakEstimatedTokens: number;
  peakEstimatedUsd?: number;
  lastSessionEndDetail: Record<string, unknown> | null;
};

/** `/api/...` JSON과 동일 — 프론트에서 그대로 타입으로 쓰면 됩니다. */
export type RalphEventsApiPayload = {
  workspace: string;
  eventsPath: string;
  usdPerMillionEstTokens: number;
  summary: RalphEventsSummary;
  events: RalphEvent[];
  error?: string;
  hint?: string;
};

export type RalphPathsOptions = {
  env?: RalphEnv;
  /** `RALPH_WORKSPACE` 미설정 시 `join(cwd, ...segments)` 로 추정 */
  cwd?: string;
  defaultWorkspaceSegments?: string[];
};

export type CreateRalphEventsHandlerOptions = RalphPathsOptions & {
  /** 읽기 실패 시 JSON에 넣을 안내 문구 */
  missingFileHint?: string;
  /** `tail` 쿼리 상한 */
  maxTail?: number;
};

/** 외부 도구에서 env 키 이름을 참조할 때 */
export type RalphEnvKeyName =
  (typeof RALPH_ENV_KEYS)[keyof typeof RALPH_ENV_KEYS];
