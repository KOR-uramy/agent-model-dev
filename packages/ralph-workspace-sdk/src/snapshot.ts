import { readFile } from "fs/promises";
import { OPENGRAZE_ENV_KEYS, RALPH_ENV_KEYS } from "./constants";
import {
  parseUsdPerMillionEstTokens,
  resolveEventsJsonlPath,
  resolveRalphWorkspace,
  resolveTelemetryJsonlPath,
} from "./paths";
import type {
  RalphEvent,
  RalphEventsApiPayload,
  RalphPathsOptions,
  RalphTokenBreakdown,
  WorkspaceFeedEvent,
} from "./types";

export function parseEventsJsonl(text: string, tail: number): RalphEvent[] {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const slice = tail > 0 ? lines.slice(-tail) : lines;
  const out: RalphEvent[] = [];
  for (const line of slice) {
    try {
      out.push(JSON.parse(line) as RalphEvent);
    } catch {
      // skip corrupt lines
    }
  }
  return out;
}

function emptyBreakdown(): RalphTokenBreakdown {
  return {
    readBytes: 0,
    writeBytes: 0,
    assistantChars: 0,
    shellChars: 0,
  };
}

/** Ralph `events.jsonl` 한 줄 → 대시보드 공통 형태 */
export function normalizeRalphEvent(raw: unknown): WorkspaceFeedEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.ts !== "string" || typeof o.kind !== "string") return null;
  const tb = o.tokenBreakdown;
  const tokenBreakdown =
    tb && typeof tb === "object"
      ? (tb as RalphTokenBreakdown)
      : emptyBreakdown();
  return {
    ts: o.ts,
    source: "ralph",
    kind: o.kind,
    detail: (o.detail ?? null) as Record<string, unknown> | null,
    iteration: typeof o.iteration === "number" ? o.iteration : 0,
    sessionId: typeof o.sessionId === "string" ? o.sessionId : "",
    estimatedTokens:
      typeof o.estimatedTokens === "number" ? o.estimatedTokens : 0,
    contextWindowPct:
      typeof o.contextWindowPct === "number" ? o.contextWindowPct : 0,
    rotateThreshold:
      typeof o.rotateThreshold === "number" ? o.rotateThreshold : 80000,
    tokenBreakdown,
  };
}

/** 앱 `workspace-telemetry.jsonl` 한 줄 */
export function normalizeApplicationEvent(
  raw: unknown,
): WorkspaceFeedEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.ts !== "string" || typeof o.kind !== "string") return null;
  if (o.source !== undefined && o.source !== "application") return null;
  return {
    ts: o.ts,
    source: "application",
    kind: o.kind,
    detail: (o.detail ?? null) as Record<string, unknown> | null,
    sessionId: typeof o.sessionId === "string" ? o.sessionId : undefined,
  };
}

function tailLines(text: string, tail: number): string[] {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  return tail > 0 ? lines.slice(-tail) : lines;
}

function parseFileToFeed(
  text: string,
  tail: number,
  mode: "ralph" | "application",
): WorkspaceFeedEvent[] {
  const lines = tailLines(text, tail);
  const out: WorkspaceFeedEvent[] = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as unknown;
      const row =
        mode === "ralph"
          ? normalizeRalphEvent(obj)
          : normalizeApplicationEvent(obj);
      if (row) out.push(row);
    } catch {
      // skip
    }
  }
  return out;
}

function attachUsd(
  events: WorkspaceFeedEvent[],
  usdPerM: number,
): WorkspaceFeedEvent[] {
  if (usdPerM <= 0) return events;
  return events.map((e) => {
    if (e.source !== "ralph") return e;
    const t = e.estimatedTokens ?? 0;
    return { ...e, estimatedUsd: (t / 1_000_000) * usdPerM };
  });
}

function aggregateApplication(merged: WorkspaceFeedEvent[]) {
  let applicationEventCount = 0;
  let totalApplicationDurationMs = 0;
  let totalApplicationUnits = 0;
  for (const e of merged) {
    if (e.source !== "application") continue;
    applicationEventCount += 1;
    const d = e.detail;
    if (!d || typeof d !== "object") continue;
    if (e.kind === "application_work_completed") {
      if (typeof d.durationMs === "number")
        totalApplicationDurationMs += d.durationMs;
      if (typeof d.units === "number") totalApplicationUnits += d.units;
    } else if (e.kind === "application_metric") {
      if (typeof d.units === "number") totalApplicationUnits += d.units;
    }
  }
  return {
    applicationEventCount,
    totalApplicationDurationMs,
    totalApplicationUnits,
  };
}

export type LoadRalphEventsSnapshotOptions = RalphPathsOptions & {
  tail?: number;
  /** Ralph events.jsonl 직접 경로 */
  eventsFile?: string;
  /** 앱 telemetry 직접 경로 */
  telemetryFile?: string;
  missingFileHint?: string;
};

const DEFAULT_HINT =
  "Set RALPH_WORKSPACE to the repo root (where .ralph lives), or run Ralph once to create .ralph/events.jsonl. App work logs use workspace-telemetry.jsonl (see ralph-workspace-sdk telemetry).";

/**
 * Ralph `events.jsonl` + 앱 `workspace-telemetry.jsonl`을 합쳐 시간순으로 반환합니다.
 */
export async function loadRalphEventsSnapshot(
  opts: LoadRalphEventsSnapshotOptions = {},
): Promise<RalphEventsApiPayload> {
  const tail = Math.min(5000, Math.max(1, opts.tail ?? 800));
  const workspace = resolveRalphWorkspace(opts);
  const ralphPath = opts.eventsFile?.trim() || resolveEventsJsonlPath(opts);
  const telemetryPath =
    opts.telemetryFile?.trim() || resolveTelemetryJsonlPath(opts);
  const usdPerM = parseUsdPerMillionEstTokens(opts);

  let ralphFeed: WorkspaceFeedEvent[] = [];
  let ralphErr: string | undefined;
  try {
    const raw = await readFile(ralphPath, "utf8");
    ralphFeed = parseFileToFeed(raw, tail, "ralph");
  } catch (e) {
    ralphErr = e instanceof Error ? e.message : String(e);
  }

  let telemFeed: WorkspaceFeedEvent[] = [];
  let telemErr: string | undefined;
  try {
    const raw = await readFile(telemetryPath, "utf8");
    telemFeed = parseFileToFeed(raw, tail, "application");
  } catch (e) {
    telemErr = e instanceof Error ? e.message : String(e);
  }

  const merged = [...ralphFeed, ...telemFeed]
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .slice(-tail);

  const withUsd = attachUsd(merged, usdPerM);

  const mergedEmpty = withUsd.length === 0;
  const error =
    mergedEmpty && ralphErr && telemErr
      ? `${ralphErr} | ${telemErr}`
      : mergedEmpty
        ? ralphErr ?? telemErr
        : undefined;

  return buildRalphEventsApiPayloadFromMerged({
    workspace,
    eventsPath: ralphPath,
    telemetryPath,
    usdPerMillionEstTokens: usdPerM,
    merged: withUsd,
    error,
    hint: mergedEmpty ? opts.missingFileHint ?? DEFAULT_HINT : undefined,
  });
}

/** 파일 없이 이미 합쳐진 `WorkspaceFeedEvent[]`로 API 페이로드를 만든다(DB 조회 후 사용). */
export function buildRalphEventsApiPayloadFromMerged(input: {
  workspace: string;
  eventsPath: string;
  telemetryPath?: string;
  usdPerMillionEstTokens: number;
  merged: WorkspaceFeedEvent[];
  error?: string;
  hint?: string;
}): RalphEventsApiPayload {
  const usdPerM = input.usdPerMillionEstTokens;
  const withUsd = attachUsd(input.merged, usdPerM);
  const peakTokens = withUsd.reduce(
    (m, e) =>
      e.source === "ralph" ? Math.max(m, e.estimatedTokens ?? 0) : m,
    0,
  );
  const lastSessionEnd = [...withUsd]
    .reverse()
    .find((e) => e.source === "ralph" && e.kind === "session_end");
  const peakUsd =
    usdPerM > 0 ? (peakTokens / 1_000_000) * usdPerM : undefined;
  const appAgg = aggregateApplication(withUsd);
  return {
    workspace: input.workspace,
    eventsPath: input.eventsPath,
    telemetryPath: input.telemetryPath,
    usdPerMillionEstTokens: usdPerM,
    summary: {
      rowCount: withUsd.length,
      peakEstimatedTokens: peakTokens,
      peakEstimatedUsd: peakUsd,
      lastSessionEndDetail: lastSessionEnd?.detail ?? null,
      ...appAgg,
    },
    events: withUsd,
    error: input.error,
    hint: input.hint,
  };
}

/** 다른 런타임에서 env 키 이름만 공유할 때 */
export function ralphEnvTemplate(): Record<keyof typeof RALPH_ENV_KEYS, string> {
  return {
    WORKSPACE: `${RALPH_ENV_KEYS.WORKSPACE}=/absolute/path/to/ralph-repo`,
    EVENTS_JSONL: `${RALPH_ENV_KEYS.EVENTS_JSONL}=/optional/custom/events.jsonl`,
    USD_PER_MILLION_EST_TOKENS: `${RALPH_ENV_KEYS.USD_PER_MILLION_EST_TOKENS}=15`,
  };
}

export function opengrazeEnvTemplate(): Record<
  keyof typeof OPENGRAZE_ENV_KEYS,
  string
> {
  return {
    TELEMETRY_JSONL: `${OPENGRAZE_ENV_KEYS.TELEMETRY_JSONL}=/optional/custom/workspace-telemetry.jsonl`,
    WORKSPACE_KEY: `${OPENGRAZE_ENV_KEYS.WORKSPACE_KEY}=my-app-or-tenant`,
  };
}
