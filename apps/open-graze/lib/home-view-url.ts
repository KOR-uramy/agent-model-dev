import type { EventSource } from "ralph-workspace-sdk";

/** 홈 `?` 쿼리 — 이미 검증·정규화된 값만 넣는다. */
export type HomeViewUrlFilters = {
  role: string | null;
  sessionId: string | null;
  /** 둘 다 있을 때만 URL에 포함한다. */
  fromIso: string | null;
  toIso: string | null;
  source: EventSource | null;
};

export function buildHomeViewSearchString(f: HomeViewUrlFilters): string {
  const q = new URLSearchParams();
  if (f.role) q.set("role", f.role);
  if (f.sessionId) q.set("sessionId", f.sessionId);
  if (f.fromIso && f.toIso) {
    q.set("from", f.fromIso);
    q.set("to", f.toIso);
  }
  if (f.source) q.set("source", f.source);
  return q.toString();
}

/** `pathname`은 보통 `/` */
export function buildHomeViewAbsoluteUrl(
  origin: string,
  pathname: string,
  f: HomeViewUrlFilters,
): string {
  const path = pathname === "" ? "/" : pathname;
  const base = origin.replace(/\/$/, "");
  const search = buildHomeViewSearchString(f);
  return search ? `${base}${path}?${search}` : `${base}${path}`;
}
