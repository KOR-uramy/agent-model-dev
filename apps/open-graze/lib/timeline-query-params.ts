/**
 * 홈 타임라인 UI용 — `ralph-workspace-sdk`의 `parseRoleQueryParam` 등과 동일 의미.
 * 클라이언트 번들이 SDK 메인 엔트리( fs/promises 의존 )를 끌어오지 않도록 분리한다.
 */
import type { AgentRoleKey, WorkspaceFeedEvent } from "ralph-workspace-sdk";

/** UI·API `role` 쿼리에서 허용하는 값과 동일한 순서 */
export const AGENT_ROLE_KEYS: readonly AgentRoleKey[] = [
  "planning",
  "design",
  "implementation",
  "test",
] as const;

export function eventDetailRole(
  detail: WorkspaceFeedEvent["detail"],
): AgentRoleKey | null {
  if (!detail || typeof detail !== "object") return null;
  const r = (detail as Record<string, unknown>).role;
  if (
    r === "planning" ||
    r === "design" ||
    r === "implementation" ||
    r === "test"
  ) {
    return r;
  }
  return null;
}

export function parseRoleQueryParam(
  value: string | null | undefined,
): AgentRoleKey | null {
  if (value == null || value.trim() === "") return null;
  const v = value.trim();
  if (
    v === "planning" ||
    v === "design" ||
    v === "implementation" ||
    v === "test"
  ) {
    return v;
  }
  return null;
}

export function parseSessionIdQueryParam(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const t = value.trim();
  return t === "" ? null : t;
}
