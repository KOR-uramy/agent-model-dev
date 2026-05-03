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
  "선택한 역할(detail.role)에 맞는 이벤트가 최근 구간에 없습니다. 전체 보기로 바꾸거나 동기화 범위를 늘려 보세요.";

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
): Promise<RalphEventsApiPayload> {
  const workspaceKey = timelineWorkspaceKey();
  const workspace = resolveRalphWorkspace(pathOpts);
  const ralphPath = resolveEventsJsonlPath(pathOpts);
  const telemetryPath = resolveTelemetryJsonlPath(pathOpts);
  const usdPerM = parseUsdPerMillionEstTokens(pathOpts);
  const t = Math.min(5000, Math.max(1, tail));
  const fetchSize = role ? Math.min(5000, Math.max(t, t * 40)) : t;

  const rows = await prisma.timelineEvent.findMany({
    where: { workspaceKey },
    orderBy: { ts: "desc" },
    take: fetchSize,
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
    merged = mergedChrono.filter((e) => eventDetailRole(e.detail) === role);
    if (before > 0 && merged.length === 0) roleFilterEmpty = true;
    if (merged.length > t) merged = merged.slice(merged.length - t);
  }

  const empty = rawEmpty;
  return buildRalphEventsApiPayloadFromMerged({
    workspace,
    eventsPath: ralphPath,
    telemetryPath,
    usdPerMillionEstTokens: usdPerM,
    merged,
    error: empty ? "TIMELINE_EMPTY" : undefined,
    hint: empty ? EMPTY_HINT : roleFilterEmpty ? ROLE_FILTER_EMPTY_HINT : undefined,
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
