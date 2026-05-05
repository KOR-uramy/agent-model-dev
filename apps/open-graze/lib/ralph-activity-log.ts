import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const DEFAULT_WORKSPACE_SEGMENTS = ["..", ".."] as const;
const DEFAULT_MAX_LINES = 200;
const MAX_VISIBLE_LINES = 80;
const MAX_LINE_LENGTH = 220;

function resolveRalphWorkspaceRoot(): string {
  const envRoot = process.env.RALPH_WORKSPACE?.trim();
  if (envRoot) return envRoot;
  return join(process.cwd(), ...DEFAULT_WORKSPACE_SEGMENTS);
}

export function resolveRalphActivityLogPath(): string {
  return join(resolveRalphWorkspaceRoot(), ".ralph", "activity.log");
}

export function resolveRalphCurrentGoalPath(): string {
  return join(resolveRalphWorkspaceRoot(), ".ralph", "current-goal.txt");
}

export function resolveRalphCurrentSessionPath(): string {
  return join(resolveRalphWorkspaceRoot(), ".ralph", "current-session.json");
}

export type RalphActivityLogSnapshot = {
  path: string;
  exists: boolean;
  updatedAt: string | null;
  lines: string[];
  workLines: string[];
  hiddenCounts: {
    token: number;
    banner: number;
    noisy: number;
  };
  status: RalphActivityStatus | null;
  workLogHint: string | null;
};

export type RalphActivityStatus = {
  rawLine: string;
  timestamp: string | null;
  tokens: number | null;
  limit: number | null;
  contextPct: number | null;
  breakdown: {
    readKb: number | null;
    writeKb: number | null;
    assistKb: number | null;
    shellKb: number | null;
  };
};

export type RalphCurrentSessionSnapshot = {
  goalPath: string;
  sessionPath: string;
  exists: boolean;
  updatedAt: string | null;
  goal: string | null;
  session: {
    updatedAt: string | null;
    workspace: string | null;
    iteration: number | null;
    role: string | null;
    roleLabel: string | null;
    model: string | null;
    goal: string | null;
    forcedErrorRecovery: boolean;
  } | null;
};

const TOKEN_STATUS_RE =
  /^\[(\d{2}:\d{2}:\d{2})\]\s+\S+\s+TOKENS:\s+(\d+)\s+\/\s+(\d+)\s+\((\d+)%\)(?:\s+\[read:(\d+)KB write:(\d+)KB assist:(\d+)KB shell:(\d+)KB\])?/;

function toInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTokenStatus(line: string): RalphActivityStatus | null {
  const match = TOKEN_STATUS_RE.exec(line);
  if (!match) return null;
  return {
    rawLine: line,
    timestamp: match[1] ?? null,
    tokens: toInt(match[2]),
    limit: toInt(match[3]),
    contextPct: toInt(match[4]),
    breakdown: {
      readKb: toInt(match[5]),
      writeKb: toInt(match[6]),
      assistKb: toInt(match[7]),
      shellKb: toInt(match[8]),
    },
  };
}

function isBannerLine(line: string): boolean {
  return (
    /^═{8,}$/.test(line) ||
    /^Ralph Session Started:/.test(line)
  );
}

function summarizeLongLine(line: string): string {
  if (line.includes("RETRYABLE:")) {
    return line.replace(/RETRYABLE:.*$/, "RETRYABLE: transient API/network issue");
  }
  if (line.includes("NON-RETRYABLE:")) {
    return line.replace(/NON-RETRYABLE:.*$/, "NON-RETRYABLE: error requires attention");
  }
  if (line.includes("API ERROR:")) {
    return line.replace(/API ERROR:.*$/, "API ERROR: see .ralph/errors.log for full payload");
  }
  if (line.length > MAX_LINE_LENGTH) {
    return `${line.slice(0, MAX_LINE_LENGTH)}...`;
  }
  return line;
}

function isLikelyWorkLine(line: string): boolean {
  return (
    line.includes("RUN ") ||
    line.includes("COMMAND ") ||
    line.includes("ASSISTANT ") ||
    line.includes("REASONING ") ||
    line.includes("SHELL FAIL") ||
    line.includes("THRASHING") ||
    line.includes("GUTTER") ||
    line.includes("NON-RETRYABLE") ||
    line.includes("RETRYABLE") ||
    line.includes("API ERROR") ||
    line.includes("ROTATE") ||
    line.includes("WARN:") ||
    line.includes("Auto-heal") ||
    line.includes("Session Started")
  );
}

function deriveWorkView(lines: string[]): {
  workLines: string[];
  hiddenCounts: RalphActivityLogSnapshot["hiddenCounts"];
  status: RalphActivityStatus | null;
  workLogHint: string | null;
} {
  let latestStatus: RalphActivityStatus | null = null;
  const hiddenCounts = { token: 0, banner: 0, noisy: 0 };
  const workLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const tokenStatus = parseTokenStatus(line);
    if (tokenStatus) {
      latestStatus = tokenStatus;
      hiddenCounts.token += 1;
      continue;
    }
    if (isBannerLine(line)) {
      hiddenCounts.banner += 1;
      if (line.startsWith("Ralph Session Started:")) {
        workLines.push(line.replace(/^Ralph Session Started:\s*/, "Session started: "));
      }
      continue;
    }
    if (!isLikelyWorkLine(line)) {
      hiddenCounts.noisy += 1;
      continue;
    }
    workLines.push(summarizeLongLine(line));
  }

  const compactLines = workLines.slice(-MAX_VISIBLE_LINES);
  const workLogHint =
    compactLines.length > 0
      ? null
      : latestStatus
        ? "이 세션은 작업 로그 없이 상태 스냅샷만 남았습니다. 보통 시작 직후 종료되었거나, 실행기가 실제 command/assistant 이벤트를 남기기 전에 중단된 경우입니다."
        : "아직 작업 내용 로그가 없습니다.";

  return {
    workLines: compactLines,
    hiddenCounts,
    status: latestStatus,
    workLogHint,
  };
}

export async function readRalphActivityLog(
  maxLines = DEFAULT_MAX_LINES,
): Promise<RalphActivityLogSnapshot> {
  const path = resolveRalphActivityLogPath();
  try {
    const [raw, info] = await Promise.all([readFile(path, "utf8"), stat(path)]);
    const lines = raw
      .split(/\r?\n/)
      .filter((line) => line.length > 0)
      .slice(-Math.max(1, maxLines));
    const derived = deriveWorkView(lines);
    return {
      path,
      exists: true,
      updatedAt: info.mtime.toISOString(),
      lines,
      workLines: derived.workLines,
      hiddenCounts: derived.hiddenCounts,
      status: derived.status,
      workLogHint: derived.workLogHint,
    };
  } catch {
    return {
      path,
      exists: false,
      updatedAt: null,
      lines: [],
      workLines: [],
      hiddenCounts: { token: 0, banner: 0, noisy: 0 },
      status: null,
      workLogHint: null,
    };
  }
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toBoolean(value: unknown): boolean {
  return value === true;
}

export async function readRalphCurrentSession(): Promise<RalphCurrentSessionSnapshot> {
  const goalPath = resolveRalphCurrentGoalPath();
  const sessionPath = resolveRalphCurrentSessionPath();

  try {
    const [goalRaw, sessionRaw, info] = await Promise.all([
      readFile(goalPath, "utf8").catch(() => ""),
      readFile(sessionPath, "utf8"),
      stat(sessionPath),
    ]);
    const parsed = JSON.parse(sessionRaw) as Record<string, unknown>;
    const fallbackGoal = goalRaw.trim() || null;
    const goal = toNullableString(parsed.goal) ?? fallbackGoal;
    return {
      goalPath,
      sessionPath,
      exists: true,
      updatedAt: info.mtime.toISOString(),
      goal,
      session: {
        updatedAt: toNullableString(parsed.updatedAt),
        workspace: toNullableString(parsed.workspace),
        iteration: toNullableNumber(parsed.iteration),
        role: toNullableString(parsed.role),
        roleLabel: toNullableString(parsed.roleLabel),
        model: toNullableString(parsed.model),
        goal,
        forcedErrorRecovery: toBoolean(parsed.forcedErrorRecovery),
      },
    };
  } catch {
    return {
      goalPath,
      sessionPath,
      exists: false,
      updatedAt: null,
      goal: null,
      session: null,
    };
  }
}
