import { readFile } from "fs/promises";
import { RALPH_ENV_KEYS } from "./constants";
import {
  parseUsdPerMillionEstTokens,
  resolveEventsJsonlPath,
  resolveRalphWorkspace,
} from "./paths";
import type {
  RalphEvent,
  RalphEventsApiPayload,
  RalphPathsOptions,
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

function attachUsd(events: RalphEvent[], usdPerM: number): RalphEvent[] {
  if (usdPerM <= 0) return events;
  return events.map((e) => ({
    ...e,
    estimatedUsd: (e.estimatedTokens / 1_000_000) * usdPerM,
  }));
}

export type LoadRalphEventsSnapshotOptions = RalphPathsOptions & {
  tail?: number;
  /** 파일 경로 직접 지정 시 env의 EVENTS_JSONL·워크스페이스보다 우선 */
  eventsFile?: string;
  /** `readFile` 실패 시 `hint` 필드 (다국어 안내 등) */
  missingFileHint?: string;
};

const DEFAULT_HINT =
  "Set RALPH_WORKSPACE to the repo root (where .ralph lives), or run Ralph once to create .ralph/events.jsonl.";

/**
 * `events.jsonl`을 읽어 대시보드·API와 동일한 페이로드를 만듭니다.
 * Node.js 전용 (`fs`).
 */
export async function loadRalphEventsSnapshot(
  opts: LoadRalphEventsSnapshotOptions = {},
): Promise<RalphEventsApiPayload> {
  const tail = Math.min(
    5000,
    Math.max(1, opts.tail ?? 800),
  );
  const workspace = resolveRalphWorkspace(opts);
  const path = opts.eventsFile?.trim() || resolveEventsJsonlPath(opts);
  const usdPerM = parseUsdPerMillionEstTokens(opts);

  try {
    const raw = await readFile(path, "utf8");
    const events = attachUsd(parseEventsJsonl(raw, tail), usdPerM);
    const peakTokens = events.reduce(
      (m, e) => Math.max(m, e.estimatedTokens ?? 0),
      0,
    );
    const lastSessionEnd = [...events]
      .reverse()
      .find((e) => e.kind === "session_end");
    const peakUsd =
      usdPerM > 0 ? (peakTokens / 1_000_000) * usdPerM : undefined;

    return {
      workspace,
      eventsPath: path,
      usdPerMillionEstTokens: usdPerM,
      summary: {
        rowCount: events.length,
        peakEstimatedTokens: peakTokens,
        peakEstimatedUsd: peakUsd,
        lastSessionEndDetail: lastSessionEnd?.detail ?? null,
      },
      events,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      error: msg,
      workspace,
      eventsPath: path,
      hint: opts.missingFileHint ?? DEFAULT_HINT,
      events: [],
      usdPerMillionEstTokens: usdPerM,
      summary: {
        rowCount: 0,
        peakEstimatedTokens: 0,
        peakEstimatedUsd: undefined,
        lastSessionEndDetail: null,
      },
    };
  }
}

/** 다른 런타임에서 env 키 이름만 공유할 때 */
export function ralphEnvTemplate(): Record<keyof typeof RALPH_ENV_KEYS, string> {
  return {
    WORKSPACE: `${RALPH_ENV_KEYS.WORKSPACE}=/absolute/path/to/ralph-repo`,
    EVENTS_JSONL: `${RALPH_ENV_KEYS.EVENTS_JSONL}=/optional/custom/events.jsonl`,
    USD_PER_MILLION_EST_TOKENS: `${RALPH_ENV_KEYS.USD_PER_MILLION_EST_TOKENS}=15`,
  };
}
