import { join } from "path";
import { RALPH_ENV_KEYS } from "./constants";
import type { RalphEnv, RalphPathsOptions } from "./types";

const DEFAULT_WORKSPACE_SEGMENTS = ["..", ".."];

function getEnv(opts: RalphPathsOptions): RalphEnv {
  return opts.env ?? (typeof process !== "undefined" ? process.env : {});
}

function getCwd(opts: RalphPathsOptions): string {
  return opts.cwd ?? (typeof process !== "undefined" ? process.cwd() : ".");
}

/**
 * Ralph가 돌아가는 Git 루트(`.ralph` 상위).
 * `RALPH_WORKSPACE`가 없으면 `cwd` + `defaultWorkspaceSegments`로 추정합니다.
 */
export function resolveRalphWorkspace(opts: RalphPathsOptions = {}): string {
  const env = getEnv(opts);
  const v = env[RALPH_ENV_KEYS.WORKSPACE]?.trim();
  if (v) return v;
  const cwd = getCwd(opts);
  const segs = opts.defaultWorkspaceSegments ?? DEFAULT_WORKSPACE_SEGMENTS;
  return join(cwd, ...segs);
}

/** `RALPH_EVENTS_JSONL` 또는 `<workspace>/.ralph/events.jsonl` */
export function resolveEventsJsonlPath(opts: RalphPathsOptions = {}): string {
  const env = getEnv(opts);
  const custom = env[RALPH_ENV_KEYS.EVENTS_JSONL]?.trim();
  if (custom) return custom;
  return join(resolveRalphWorkspace(opts), ".ralph", "events.jsonl");
}

/** 추정 토큰 100만당 USD (0이면 비용 필드 생략·표시 안 함) */
export function parseUsdPerMillionEstTokens(
  opts: RalphPathsOptions = {},
): number {
  const env = getEnv(opts);
  const raw = env[RALPH_ENV_KEYS.USD_PER_MILLION_EST_TOKENS];
  if (raw == null || raw === "") return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
