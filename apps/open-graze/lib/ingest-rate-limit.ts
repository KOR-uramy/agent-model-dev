/**
 * 수집 API(`POST /api/v1/events`) — API 키 단위 고정 윈도 레이트 리밋(인메모리).
 * 서버리스/다중 인스턴스에서는 인스턴스별로만 적용된다(운영 문서의 한계로 명시).
 */

const GLOBAL_KEY = "__openGrazeIngestRateLimit" as const;

type WindowState = { windowStartMs: number; count: number };

type GlobalStore = Map<string, WindowState>;

function getStore(): GlobalStore {
  const g = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: GlobalStore;
  };
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Map();
  return g[GLOBAL_KEY];
}

const DEFAULT_LIMIT_PER_WINDOW = 120;
const DEFAULT_WINDOW_MS = 60_000;

function parseLimitPerWindow(): number {
  const raw = process.env.INGEST_RATE_LIMIT_PER_WINDOW?.trim();
  if (raw === "0") return 0;
  if (!raw) return DEFAULT_LIMIT_PER_WINDOW;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_LIMIT_PER_WINDOW;
  return n;
}

function parseWindowMs(): number {
  const raw = process.env.INGEST_RATE_LIMIT_WINDOW_MS?.trim();
  if (!raw) return DEFAULT_WINDOW_MS;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1_000) return DEFAULT_WINDOW_MS;
  return Math.min(n, 3_600_000);
}

export function getIngestRateLimitConfig(): {
  limitPerWindow: number;
  windowMs: number;
} {
  return {
    limitPerWindow: parseLimitPerWindow(),
    windowMs: parseWindowMs(),
  };
}

export type IngestRateLimitOk = {
  ok: true;
  limit: number;
  remaining: number;
  resetAtMs: number;
};

export type IngestRateLimitDenied = {
  ok: false;
  limit: number;
  remaining: number;
  resetAtMs: number;
  retryAfterSec: number;
};

export type IngestRateLimitResult = IngestRateLimitOk | IngestRateLimitDenied;

/**
 * @param apiKeyId — DB `ApiKey.id` (키별 격리)
 */
export function consumeIngestRateLimitToken(
  apiKeyId: string,
  nowMs: number = Date.now(),
): IngestRateLimitResult {
  const { limitPerWindow, windowMs } = getIngestRateLimitConfig();
  if (limitPerWindow <= 0) {
    return {
      ok: true,
      limit: 0,
      remaining: 0,
      resetAtMs: nowMs,
    };
  }

  const store = getStore();
  let row = store.get(apiKeyId);
  if (!row || nowMs - row.windowStartMs >= windowMs) {
    row = { windowStartMs: nowMs, count: 0 };
  }

  if (row.count >= limitPerWindow) {
    const resetAtMs = row.windowStartMs + windowMs;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((resetAtMs - nowMs) / 1000),
    );
    return {
      ok: false,
      limit: limitPerWindow,
      remaining: 0,
      resetAtMs,
      retryAfterSec,
    };
  }

  row.count += 1;
  store.set(apiKeyId, row);
  const resetAtMs = row.windowStartMs + windowMs;
  return {
    ok: true,
    limit: limitPerWindow,
    remaining: limitPerWindow - row.count,
    resetAtMs,
  };
}

export function ingestRateLimitHeaders(rl: IngestRateLimitResult): Headers {
  const h = new Headers();
  if (rl.limit <= 0) return h;
  h.set("X-RateLimit-Limit", String(rl.limit));
  h.set("X-RateLimit-Remaining", String(Math.max(0, rl.remaining)));
  h.set("X-RateLimit-Reset", String(Math.floor(rl.resetAtMs / 1000)));
  if (!rl.ok) {
    h.set("Retry-After", String(rl.retryAfterSec));
  }
  return h;
}
