import { getDashboardEventsRateLimitConfig } from "@/lib/dashboard-events-rate-limit";
import { getIngestMaxBodyBytes } from "@/lib/ingest-body";
import { getIngestRateLimitConfig } from "@/lib/ingest-rate-limit";
import { NextResponse } from "next/server";

/**
 * 비인증 공개 한도 스냅샷(비밀·워크스페이스 데이터 없음). 동종 SaaS의 “한도 표”에 대응하는 JSON.
 */
export async function GET() {
  const ingest = getIngestRateLimitConfig();
  const dash = getDashboardEventsRateLimitConfig();
  return NextResponse.json({
    ingest: {
      postEvents: {
        maxBodyBytes: getIngestMaxBodyBytes(),
        rateLimitPerWindow:
          ingest.limitPerWindow <= 0 ? null : ingest.limitPerWindow,
        rateLimitWindowMs:
          ingest.limitPerWindow <= 0 ? null : ingest.windowMs,
        rateLimitDisabled: ingest.limitPerWindow <= 0,
      },
    },
    dashboard: {
      getWorkspaceEvents: {
        rateLimitPerWindow:
          dash.limitPerWindow <= 0 ? null : dash.limitPerWindow,
        rateLimitWindowMs:
          dash.limitPerWindow <= 0 ? null : dash.windowMs,
        rateLimitDisabled: dash.limitPerWindow <= 0,
      },
    },
  });
}
