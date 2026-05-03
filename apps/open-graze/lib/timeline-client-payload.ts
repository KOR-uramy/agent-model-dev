import type {
  RalphEventsApiPayload,
  WorkspaceFeedEvent,
} from "ralph-workspace-sdk";

function attachUsd(
  events: WorkspaceFeedEvent[],
  usdPerM: number,
): WorkspaceFeedEvent[] {
  if (usdPerM <= 0) return events;
  return events.map((e) => {
    if (e.source !== "ralph") return e;
    const t = e.estimatedTokens ?? 0;
    return { ...e, estimatedUsd: (t / 1_000_000) * usdPerM };
  });
}

function aggregateApplication(merged: WorkspaceFeedEvent[]) {
  let applicationEventCount = 0;
  let totalApplicationDurationMs = 0;
  let totalApplicationUnits = 0;
  for (const e of merged) {
    if (e.source !== "application") continue;
    applicationEventCount += 1;
    const d = e.detail;
    if (!d || typeof d !== "object") continue;
    if (e.kind === "application_work_completed") {
      if (typeof d.durationMs === "number")
        totalApplicationDurationMs += d.durationMs;
      if (typeof d.units === "number") totalApplicationUnits += d.units;
    } else if (e.kind === "application_metric") {
      if (typeof d.units === "number") totalApplicationUnits += d.units;
    }
  }
  return {
    applicationEventCount,
    totalApplicationDurationMs,
    totalApplicationUnits,
  };
}

const RANGE_TRUNCATED_HINT =
  "선택한 기간에 표시 상한(10,000건)에 도달했습니다. 기간을 나누거나 필터를 좁혀 주세요.";

const RANGE_EMPTY_HINT =
  "이 구간·필터에 맞는 활동이 없습니다. 기간을 넓히거나 필터를 바꿔 보세요.";

/**
 * `GET /api/ralph/events/range` 결과를 홈 화면용 `RalphEventsApiPayload` 형태로 맞춘다.
 * 경로·워크스페이스 등 메타는 `tail=1` 등으로 받은 메타 페이로드에서 가져온다.
 */
export function buildApiPayloadFromMetaAndRangeEvents(
  meta: RalphEventsApiPayload,
  rangeEvents: WorkspaceFeedEvent[],
  opts: { truncated: boolean },
): RalphEventsApiPayload {
  const usdPerM = meta.usdPerMillionEstTokens;
  const withUsd = attachUsd(rangeEvents, usdPerM);
  const peakTokens = withUsd.reduce(
    (m, e) =>
      e.source === "ralph" ? Math.max(m, e.estimatedTokens ?? 0) : m,
    0,
  );
  const lastSessionEnd = [...withUsd]
    .reverse()
    .find((e) => e.source === "ralph" && e.kind === "session_end");
  const peakUsd =
    usdPerM > 0 ? (peakTokens / 1_000_000) * usdPerM : undefined;
  const appAgg = aggregateApplication(withUsd);
  const empty = withUsd.length === 0;
  const timelineEmpty = meta.error === "TIMELINE_EMPTY";

  let hint: string | undefined;
  if (opts.truncated) hint = RANGE_TRUNCATED_HINT;
  else if (empty && !timelineEmpty) hint = RANGE_EMPTY_HINT;
  else if (empty && timelineEmpty) hint = meta.hint;

  return {
    workspace: meta.workspace,
    eventsPath: meta.eventsPath,
    telemetryPath: meta.telemetryPath,
    usdPerMillionEstTokens: meta.usdPerMillionEstTokens,
    summary: {
      rowCount: withUsd.length,
      peakEstimatedTokens: peakTokens,
      peakEstimatedUsd: peakUsd,
      lastSessionEndDetail: lastSessionEnd?.detail ?? null,
      ...appAgg,
    },
    events: withUsd,
    error: empty && timelineEmpty ? "TIMELINE_EMPTY" : undefined,
    hint,
  };
}
