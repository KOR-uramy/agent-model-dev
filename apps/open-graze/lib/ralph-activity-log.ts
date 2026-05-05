import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const DEFAULT_WORKSPACE_SEGMENTS = ["..", ".."] as const;
const DEFAULT_MAX_LINES = 200;

function resolveRalphWorkspaceRoot(): string {
  const envRoot = process.env.RALPH_WORKSPACE?.trim();
  if (envRoot) return envRoot;
  return join(process.cwd(), ...DEFAULT_WORKSPACE_SEGMENTS);
}

export function resolveRalphActivityLogPath(): string {
  return join(resolveRalphWorkspaceRoot(), ".ralph", "activity.log");
}

export type RalphActivityLogSnapshot = {
  path: string;
  exists: boolean;
  updatedAt: string | null;
  lines: string[];
};

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
    return {
      path,
      exists: true,
      updatedAt: info.mtime.toISOString(),
      lines,
    };
  } catch {
    return {
      path,
      exists: false,
      updatedAt: null,
      lines: [],
    };
  }
}
