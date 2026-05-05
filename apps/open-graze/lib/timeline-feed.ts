import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import type {
  AgentRoleKey,
  EventSource,
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
import { TIMELINE_RANGE_MAX_ROWS } from "@/lib/timeline-constants";

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

const SOURCE_FILTER_EMPTY_HINT =
  "선택한 채널(에이전트·제품)에 맞는 행이 없습니다. 채널 필터를 해제하거나 구간·세션을 조정해 보세요.";

/** `GET /api/ralph/events`·`GET /api/ralph/events/range` 공통 — 비어 있지 않은 `role`이 네 가지가 아닐 때 */
export const RALPH_EVENTS_ROLE_QUERY_ERROR =
  "쿼리 `role`은 planning, design, implementation, test 중 하나이거나 생략·빈 값이어야 합니다.";

/** `GET /api/ralph/events` — 비어 있지 않은 `source`가 허용 집합이 아닐 때 */
export const RALPH_EVENTS_SOURCE_QUERY_ERROR =
  "쿼리 `source`는 ralph, application 중 하나이거나 생략·빈 값이어야 합니다.";

export function parseSessionIdQueryParam(raw: string | null): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  return t === "" ? null : t;
}

/**
 * SQLite `TimelineEvent`만 읽습니다(JSONL 동기화 후 데이터).
 * 시각 비교는 SQLite `strftime('%s', …)`로 하여 초 단위로 맞춥니다(밀리초 유무 혼재 완화).
 */
export type TimelineRangeLoadResult = {
  events: WorkspaceFeedEvent[];
  /** DB `LIMIT` 행 수에 도달해 같은 구간에 더 있을 수 있음(손상 페이로드로 파싱 실패해도 동일 기준). */
  truncated: boolean;
};

/** `GET /api/ralph/events/range`와 동일한 선택 필터(역할·세션·출처). */
export type TimelineRangeLoadOpts = {
  role: AgentRoleKey | null;
  sessionId: string | null;
  source?: EventSource | null;
  /**
   * true면 구간 안에서 시각 내림차순으로 잘라 최근 건부터 가져온 뒤, 반환 배열은 시각 오름차순으로 맞춘다(홈 타임라인).
   * false면 구간 안 오름차순으로 앞에서부터(기본, range API).
   */
  newestFirst?: boolean;
};

export async function loadTimelineEventsInRange(
  fromIso: string,
  toIso: string,
  take: number,
  opts: TimelineRangeLoadOpts = { role: null, sessionId: null, source: null },
): Promise<TimelineRangeLoadResult> {
  const workspaceKey = timelineWorkspaceKey();
  const capped = Math.min(TIMELINE_RANGE_MAX_ROWS, Math.max(1, take));
  const role = opts.role;
  const sessionId = opts.sessionId;
  const source = opts.source ?? null;
  const newestFirst = opts.newestFirst === true;
  const orderDir = newestFirst ? Prisma.raw("DESC") : Prisma.raw("ASC");
  const whereParts: Prisma.Sql[] = [
    Prisma.sql`"workspaceKey" = ${workspaceKey}`,
    Prisma.sql`strftime('%s', "ts") >= strftime('%s', ${fromIso})`,
    Prisma.sql`strftime('%s', "ts") <= strftime('%s', ${toIso})`,
  ];
  if (sessionId) {
    whereParts.push(
      Prisma.sql`json_extract("payload", '$.sessionId') = ${sessionId}`,
    );
  }
  if (role) {
    whereParts.push(
      Prisma.sql`json_extract("payload", '$.detail.role') = ${role}`,
    );
  }
  if (source) {
    whereParts.push(Prisma.sql`"source" = ${source}`);
  }
  const whereSql = Prisma.join(whereParts, " AND ");
  const rows = await prisma.$queryRaw<{ payload: string }[]>`
    SELECT "payload"
    FROM "TimelineEvent"
    WHERE ${whereSql}
    ORDER BY "ts" ${orderDir}
    LIMIT ${capped}
  `;
  const truncated = rows.length >= capped;
  const out: WorkspaceFeedEvent[] = [];
  for (const r of rows) {
    try {
      const ev = JSON.parse(r.payload) as WorkspaceFeedEvent;
      if (
        ev &&
        typeof ev.ts === "string" &&
        typeof ev.kind === "string"
      ) {
        out.push(ev);
      }
    } catch {
      /* skip corrupt payload */
    }
  }
  if (newestFirst) out.reverse();
  return { events: out, truncated };
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
  source: EventSource | null = null,
  range: { fromIso: string; toIso: string } | null = null,
): Promise<RalphEventsApiPayload> {
  const workspaceKey = timelineWorkspaceKey();
  const workspace = resolveRalphWorkspace(pathOpts);
  const ralphPath = resolveEventsJsonlPath(pathOpts);
  const telemetryPath = resolveTelemetryJsonlPath(pathOpts);
  const usdPerM = parseUsdPerMillionEstTokens(pathOpts);
  const t = Math.min(5000, Math.max(1, tail));

  if (range) {
    const { events } = await loadTimelineEventsInRange(
      range.fromIso,
      range.toIso,
      t,
      { role, sessionId, source, newestFirst: true },
    );
    const merged = events;
    const sourceFilterEmpty = Boolean(source && events.length === 0);
    const rawEmpty = events.length === 0;
    const empty = rawEmpty;
    const sessionFilterMiss = Boolean(sessionId && empty);
    const timelineGloballyEmpty = empty && !sessionId && !role;
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
          : sourceFilterEmpty
            ? SOURCE_FILTER_EMPTY_HINT
            : role && empty
              ? ROLE_FILTER_EMPTY_HINT
              : undefined,
    });
  }

  const fetchSize =
    role || sessionId || source ? Math.min(5000, Math.max(t, t * 40)) : t;

  let rows: { payload: string }[];
  if (sessionId) {
    const sessionWhereParts: Prisma.Sql[] = [
      Prisma.sql`"workspaceKey" = ${workspaceKey}`,
      Prisma.sql`json_extract("payload", '$.sessionId') = ${sessionId}`,
    ];
    if (source) sessionWhereParts.push(Prisma.sql`"source" = ${source}`);
    const sessionWhereSql = Prisma.join(sessionWhereParts, " AND ");
    rows = await prisma.$queryRaw<{ payload: string }[]>`
      SELECT "payload"
      FROM "TimelineEvent"
      WHERE ${sessionWhereSql}
      ORDER BY "ts" DESC
      LIMIT ${fetchSize}
    `;
  } else {
    rows = await prisma.timelineEvent.findMany({
      where: {
        workspaceKey,
        ...(source ? { source } : {}),
      },
      orderBy: { ts: "desc" },
      take: fetchSize,
      select: { payload: true },
    });
  }

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
  let sourceFilterEmpty = false;
  if (source) {
    const before = merged.length;
    merged = merged.filter((e) => e.source === source);
    if (before > 0 && merged.length === 0) sourceFilterEmpty = true;
  }
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
  const timelineGloballyEmpty = empty && !sessionId && !source;

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
        : sourceFilterEmpty
          ? SOURCE_FILTER_EMPTY_HINT
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
