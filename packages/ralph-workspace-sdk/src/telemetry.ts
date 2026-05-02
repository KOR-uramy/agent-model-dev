import { appendFile, mkdir } from "fs/promises";
import { dirname } from "path";
import {
  resolveOpengrazeWorkspaceKey,
  resolveTelemetryJsonlPath,
} from "./paths";
import type {
  ApplicationTelemetryDetail,
  ApplicationTelemetryRecord,
  RalphEnv,
  RalphPathsOptions,
} from "./types";

export type AppendTelemetryOptions = RalphPathsOptions & {
  telemetryFile?: string;
};

function isoNow(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * 앱/백엔드에서 한 줄 JSONL을 추가합니다. OpenGraze가 Ralph 이벤트와 함께 읽습니다.
 *
 * @example
 * ```ts
 * await appendWorkspaceTelemetryEvent({}, {
 *   kind: "application_work_completed",
 *   detail: { workId: "job-1", title: "배포", durationMs: 12_000, units: 3, unitLabel: "서비스" },
 * });
 * ```
 */
export async function appendWorkspaceTelemetryEvent(
  opts: AppendTelemetryOptions,
  partial: Omit<ApplicationTelemetryRecord, "ts" | "source"> & {
    detail?: ApplicationTelemetryDetail | Record<string, unknown> | null;
  },
): Promise<void> {
  const file =
    opts.telemetryFile?.trim() || resolveTelemetryJsonlPath(opts);
  await mkdir(dirname(file), { recursive: true });

  const env: RalphEnv = opts.env ?? process.env;
  const workspaceKey =
    partial.workspaceKey ?? resolveOpengrazeWorkspaceKey(opts);

  const row: ApplicationTelemetryRecord = {
    ts: isoNow(),
    source: "application",
    kind: partial.kind,
    detail: partial.detail ?? null,
    sessionId: partial.sessionId,
    workspaceKey,
  };

  await appendFile(file, `${JSON.stringify(row)}\n`, "utf8");
}

export type ApplicationLogger = {
  /** 작업 단위 시작 */
  startWork: (input: {
    workId: string;
    title: string;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  /** 작업 단위 종료 — 소요 시간·작업량 기록 */
  completeWork: (input: {
    workId: string;
    title?: string;
    durationMs: number;
    units?: number;
    unitLabel?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  /** 중간 체크포인트(시간 누적 없이 상태만) */
  checkpoint: (input: {
    workId: string;
    title?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  /** 임의 지표(배치 크기, 처리 건수 등) */
  metric: (input: {
    workId?: string;
    units: number;
    unitLabel: string;
    notes?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
};

/**
 * 앱 코드에서 재사용하기 쉬운 로거. 같은 `workId`로 start → complete를 호출하면
 * 플랫폼에서 작업 내역·시간·작업량을 추적하기 좋습니다.
 */
export function createApplicationLogger(
  opts: AppendTelemetryOptions = {},
): ApplicationLogger {
  const base = opts;

  return {
    startWork: async ({ workId, title, metadata }) => {
      await appendWorkspaceTelemetryEvent(base, {
        kind: "application_work_started",
        detail: {
          workId,
          title,
          phase: "start",
          metadata,
        },
      });
    },
    completeWork: async ({
      workId,
      title,
      durationMs,
      units,
      unitLabel,
      metadata,
    }) => {
      await appendWorkspaceTelemetryEvent(base, {
        kind: "application_work_completed",
        detail: {
          workId,
          title,
          phase: "end",
          durationMs,
          units,
          unitLabel,
          metadata,
        },
      });
    },
    checkpoint: async ({ workId, title, notes, metadata }) => {
      await appendWorkspaceTelemetryEvent(base, {
        kind: "application_work_checkpoint",
        detail: {
          workId,
          title,
          phase: "checkpoint",
          notes,
          metadata,
        },
      });
    },
    metric: async ({ workId, units, unitLabel, notes, metadata }) => {
      await appendWorkspaceTelemetryEvent(base, {
        kind: "application_metric",
        detail: {
          workId,
          phase: "metric",
          units,
          unitLabel,
          notes,
          metadata,
        },
      });
    },
  };
}
