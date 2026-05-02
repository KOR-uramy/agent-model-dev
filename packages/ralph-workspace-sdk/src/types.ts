import { OPENGRAZE_ENV_KEYS, RALPH_ENV_KEYS } from "./constants";

export type RalphEnv = Record<string, string | undefined>;

export type EventSource = "ralph" | "application";

/**
 * 대시보드 한 줄 — Ralph `events.jsonl` + 앱 `workspace-telemetry.jsonl` 병합 결과.
 * Ralph 행은 `source: 'ralph'`로 정규화됩니다.
 */
export type WorkspaceFeedEvent = {
  ts: string;
  source: EventSource;
  kind: string;
  detail: Record<string, unknown> | null;
  /** Ralph 전용 (앱 이벤트에서는 생략 가능) */
  iteration?: number;
  sessionId?: string;
  estimatedTokens?: number;
  contextWindowPct?: number;
  rotateThreshold?: number;
  tokenBreakdown?: RalphTokenBreakdown;
  estimatedUsd?: number;
};

/** 앱에서 `appendWorkspaceTelemetryEvent`로 쓸 때 `detail` 권장 형태 */
export type ApplicationTelemetryDetail = {
  workId?: string;
  title?: string;
  phase?: "start" | "end" | "checkpoint" | "metric";
  /** 작업 구간 소요 시간(ms) — 주로 `application_work_completed` */
  durationMs?: number;
  /** 작업량(건수·바이트 등) */
  units?: number;
  unitLabel?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
};

export type ApplicationTelemetryRecord = {
  ts: string;
  source: "application";
  kind: string;
  detail: ApplicationTelemetryDetail | Record<string, unknown> | null;
  sessionId?: string;
  /** 멀티 앱·멀티 워크스페이스 구분 */
  workspaceKey?: string;
};

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
  /** `source === 'application'` 행 개수 */
  applicationEventCount?: number;
  /** `application_work_completed`의 `detail.durationMs` 합 */
  totalApplicationDurationMs?: number;
  /** `application_work_completed` 등에서 `detail.units` 합 (숫자만) */
  totalApplicationUnits?: number;
};

/** `/api/...` JSON과 동일 — 프론트에서 그대로 타입으로 쓰면 됩니다. */
export type RalphEventsApiPayload = {
  workspace: string;
  eventsPath: string;
  /** 앱 작업 로그 경로 (없을 수 있음) */
  telemetryPath?: string;
  usdPerMillionEstTokens: number;
  summary: RalphEventsSummary;
  events: WorkspaceFeedEvent[];
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

export type OpengrazeEnvKeyName =
  (typeof OPENGRAZE_ENV_KEYS)[keyof typeof OPENGRAZE_ENV_KEYS];
