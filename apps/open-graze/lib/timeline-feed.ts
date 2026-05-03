import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import type {
  AgentRoleKey,
  RalphEventsApiPayload,
  WorkspaceFeedEvent,
} from "ralph-workspace-sdk";
import {
  buildRalphEventsApiPayloadFromMerged,
  eventDetailRole,
  loadRalphEventsSnapshot,
  parseUsdPerMillionEstTokens,
  resolveEventsJsonlPath,
  resolveOpengrazeWorkspaceKey,
  resolveRalphWorkspace,
  resolveTelemetryJsonlPath,
} from "ralph-workspace-sdk";
import { prisma } from "@/lib/prisma";

const pathOpts = {
  env: process.env,
  cwd: process.cwd(),
  defaultWorkspaceSegments: ["..", ".."],
};

const EMPTY_HINT =
  "아직 이 화면에 올라온 활동 기록이 없습니다. 로컬 에이전트·앱에서 쌓인 로그가 동기화되면 여기에 표시됩니다. 연동 설정은 운영 문서를 참고하세요.";

const ROLE_FILTER_EMPTY_HINT =
  "선택한 역할이 최근 구간에 없습니다. 역할 필터를 해제하거나 tail 값을 늘려 보세요.";

const SESSION_FILTER_EMPTY_HINT =
  "해당 세션 ID로 동기화된 이벤트가 없습니다. 식별자를 확인하거나 동기화를 실행해 보세요.";

/** `GET /api/ralph/events/range` 한 번에 돌려줄 최대 행 수 */
export const TIMELINE_RANGE_MAX_ROWS = 10_000;

/** `GET /api/ralph/events`·`GET /api/ralph/events/range` 공통 — 비어 있지 않은 `role`이 네 가지가 아닐 때 */
export const RALPH_EVENTS_ROLE_QUERY_ERROR =
  "쿼리 `role`은 planning, design, implementation, test 중 하나이거나 생략·빈 값이어야 합니다.";

export function parseSessionIdQueryParam(raw: string | null): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  return t === "" ? null : t;
}

export type TimelineRangeParseResult =
  | { ok: true; fromIso: string; toIso: string }
  | { ok: false; message: string };

export function parseTimelineRangeParams(
  fromRaw: string | null,
  toRaw: string | null,
): TimelineRangeParseResult {
  const fromTrim = fromRaw?.trim() ?? "";
  const toTrim = toRaw?.trim() ?? "";
  if (!fromTrim || !toTrim) {
    return {
      ok: false,
      message:
        "쿼리 `from`·`to`는 필수입니다(ISO 8601, 예: 2026-05-03T00:00:00Z).",
    };
  }
  const fromMs = Date.parse(fromTrim);
  const toMs = Date.parse(toTrim);
  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
    return {
      ok: false,
      message: "`from`·`to`는 파싱 가능한 ISO 8601 날짜·시각이어야 합니다.",
    };
  }
  if (fromMs > toMs) {
    return { ok: false, message: "`from`은 `to`보다 이전이거나 같아야 합니다." };
  }
  return {
    ok: true,
    fromIso: new Date(fromMs).toISOString(),
    toIso: new Date(toMs).toISOString(),
  };
}

/**
 * SQLite `TimelineEvent`만 읽습니다(JSONL 동기화 후 데이터).
 * 시각 비교는 SQLite `strftime('%s', …)`로 하여 초 단위로 맞춥니다(밀리초 유무 혼재 완화).
 */
export async function loadTimelineEventsInRange(
  fromIso: string,
  toIso: string,
  take: number,
  opts?: {
    role: AgentRoleKey | null;
    sessionId: string | null;
  },
): Promise<WorkspaceFeedEvent[]> {
  const workspaceKey = timelineWorkspaceKey();
  const capped = Math.min(TIMELINE_RANGE_MAX_ROWS, Math.max(1, take));
  const role = opts?.role ?? null;
  const sessionId = opts?.sessionId ?? null;

  const rows =
    role && sessionId
      ? await prisma.$queryRaw<{ payload: string }[]>`
        SELECT "payload"
        FROM "TimelineEvent"
        WHERE "workspaceKey" = ${workspaceKey}
          AND strftime('%s', "ts") >= strftime('%s', ${fromIso})
          AND strftime('%s', "ts") <= strftime('%s', ${toIso})
          AND json_extract("payload", '$.sessionId') = ${sessionId}
          AND json_extract("payload", '$.detail.role') = ${role}
        ORDER BY "ts" ASC
        LIMIT ${capped}
      `
      : sessionId
        ? await prisma.$queryRaw<{ payload: string }[]>`
        SELECT "payload"
        FROM "TimelineEvent"
        WHERE "workspaceKey" = ${workspaceKey}
          AND strftime('%s', "ts") >= strftime('%s', ${fromIso})
          AND strftime('%s', "ts") <= strftime('%s', ${toIso})
          AND json_extract("payload", '$.sessionId') = ${sessionId}
        ORDER BY "ts" ASC
        LIMIT ${capped}
      `
        : role
          ? await prisma.$queryRaw<{ payload: string }[]>`
        SELECT "payload"
        FROM "TimelineEvent"
        WHERE "workspaceKey" = ${workspaceKey}
          AND strftime('%s', "ts") >= strftime('%s', ${fromIso})
          AND strftime('%s', "ts") <= strftime('%s', ${toIso})
          AND json_extract("payload", '$.detail.role') = ${role}
        ORDER BY "ts" ASC
        LIMIT ${capped}
      `
          : await prisma.$queryRaw<{ payload: string }[]>`
    SELECT "payload"
    FROM "TimelineEvent"
    WHERE "workspaceKey" = ${workspaceKey}
      AND strftime('%s', "ts") >= strftime('%s', ${fromIso})
      AND strftime('%s', "ts") <= strftime('%s', ${toIso})
    ORDER BY "ts" ASC
    LIMIT ${capped}
  `;
  const out: WorkspaceFeedEvent[] = [];
  for (const r of rows) {
    try {
      const ev = JSON.parse(r.payload) as WorkspaceFeedEvent;
      if (ev && typeof ev.ts === "string" && typeof ev.kind === "string") {
        out.push(ev);
      }
    } catch {
      /* skip corrupt payload */
    }
  }
  return out;
}

function timelineWorkspaceKey(): string {
  return (
    resolveOpengrazeWorkspaceKey(pathOpts)?.trim() || "default"
  );
}

function lineHash(e: WorkspaceFeedEvent): string {
  return createHash("sha256")
    .update(
      `${e.source}\0${e.ts}\0${e.kind}\0${JSON.stringify(e.detail ?? null)}`,
    )
    .digest("hex");
}

export async function loadTimelineFromDb(
  tail: number,
  role: AgentRoleKey | null = null,
  sessionId: string | null = null,
): Promise<RalphEventsApiPayload> {
  const workspaceKey = timelineWorkspaceKey();
  const workspace = resolveRalphWorkspace(pathOpts);
  const ralphPath = resolveEventsJsonlPath(pathOpts);
  const telemetryPath = resolveTelemetryJsonlPath(pathOpts);
  const usdPerM = parseUsdPerMillionEstTokens(pathOpts);
  const t = Math.min(5000, Math.max(1, tail));
  const fetchSize =
    role || sessionId ? Math.min(5000, Math.max(t, t * 40)) : t;

  const rows = sessionId
    ? await prisma.$queryRaw<{ payload: string }[]>`
        SELECT "payload"
        FROM "TimelineEvent"
        WHERE "workspaceKey" = ${workspaceKey}
          AND json_extract("payload", '$.sessionId') = ${sessionId}
        ORDER BY "ts" DESC
        LIMIT ${fetchSize}
      `
    : await prisma.timelineEvent.findMany({
        where: { workspaceKey },
        orderBy: { ts: "desc" },
        take: fetchSize,
        select: { payload: true },
      });

  const mergedChrono: WorkspaceFeedEvent[] = rows
    .map((r) => {
      try {
        return JSON.parse(r.payload) as WorkspaceFeedEvent;
      } catch {
        return null;
      }
    })
    .filter((x): x is WorkspaceFeedEvent => x != null)
    .reverse();

  const rawEmpty = mergedChrono.length === 0;
  let merged = mergedChrono;
  let roleFilterEmpty = false;

  if (role) {
    const before = merged.length;
    merged = merged.filter((e) => eventDetailRole(e.detail) === role);
    if (before > 0 && merged.length === 0) roleFilterEmpty = true;
  }

  if (merged.length > t) {
    merged = merged.slice(merged.length - t);
  }

  const empty = rawEmpty;
  const sessionFilterMiss = Boolean(sessionId && empty);
  const timelineGloballyEmpty = empty && !sessionId;

  return buildRalphEventsApiPayloadFromMerged({
    workspace,
    eventsPath: ralphPath,
    telemetryPath,
    usdPerMillionEstTokens: usdPerM,
    merged,
    error: timelineGloballyEmpty ? "TIMELINE_EMPTY" : undefined,
    hint: timelineGloballyEmpty
      ? EMPTY_HINT
      : sessionFilterMiss
        ? SESSION_FILTER_EMPTY_HINT
        : roleFilterEmpty
          ? ROLE_FILTER_EMPTY_HINT
          : undefined,
  });
}

export async function syncJsonlToTimeline(
  tail: number,
): Promise<{ inserted: number; skipped: number }> {
  const workspaceKey = timelineWorkspaceKey();
  const snap = await loadRalphEventsSnapshot({
    ...pathOpts,
    tail: Math.min(20_000, Math.max(1, tail)),
  });

  let inserted = 0;
  let skipped = 0;
  for (const e of snap.events) {
    const hash = lineHash(e);
    const payload = JSON.stringify(e);
    try {
      await prisma.timelineEvent.create({
        data: {
          workspaceKey,
          lineHash: hash,
          source: e.source,
          ts: e.ts,
          kind: e.kind,
          payload,
        },
      });
      inserted += 1;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        skipped += 1;
        continue;
      }
      throw err;
    }
  }
  return { inserted, skipped };
}
