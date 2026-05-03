import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import type {
  AgentRoleKey,
  RalphEventsApiPayload,
  WorkspaceFeedEvent,
} from "ralph-workspace-sdk";
import {
  buildRalphEventsApiPayloadFromMerged,
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

type TimelineEventRow = {
  id: string;
  workspaceKey: string;
  lineHash: string;
  source: string;
  ts: string;
  kind: string;
  payload: string;
  createdAt: Date;
};

export async function loadTimelineFromDb(
  tail: number,
  opts?: { role?: AgentRoleKey },
): Promise<RalphEventsApiPayload> {
  const workspaceKey = timelineWorkspaceKey();
  const workspace = resolveRalphWorkspace(pathOpts);
  const ralphPath = resolveEventsJsonlPath(pathOpts);
  const telemetryPath = resolveTelemetryJsonlPath(pathOpts);
  const usdPerM = parseUsdPerMillionEstTokens(pathOpts);
  const t = Math.min(5000, Math.max(1, tail));
  const role = opts?.role;

  const rows: TimelineEventRow[] =
    role == null
      ? await prisma.timelineEvent.findMany({
          where: { workspaceKey },
          orderBy: { ts: "desc" },
          take: t,
        })
      : await prisma.$queryRaw<TimelineEventRow[]>(Prisma.sql`
          SELECT
            "id",
            "workspaceKey",
            "lineHash",
            "source",
            "ts",
            "kind",
            "payload",
            "createdAt"
          FROM "TimelineEvent"
          WHERE "workspaceKey" = ${workspaceKey}
            AND json_extract("payload", '$.detail.role') = ${role}
          ORDER BY "ts" DESC
          LIMIT ${t}
        `);

  const merged: WorkspaceFeedEvent[] = rows
    .map((r) => {
      try {
        return JSON.parse(r.payload) as WorkspaceFeedEvent;
      } catch {
        return null;
      }
    })
    .filter((x): x is WorkspaceFeedEvent => x != null)
    .reverse();

  const empty = merged.length === 0;
  const showTimelineEmpty = empty && role == null;
  return buildRalphEventsApiPayloadFromMerged({
    workspace,
    eventsPath: ralphPath,
    telemetryPath,
    usdPerMillionEstTokens: usdPerM,
    merged,
    error: showTimelineEmpty ? "TIMELINE_EMPTY" : undefined,
    hint: showTimelineEmpty ? EMPTY_HINT : undefined,
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
