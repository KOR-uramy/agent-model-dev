/**
 * OpenGraze(Workspace Platform) **수집 API** HTTP 클라이언트.
 * 다른 Next·Node·Bun 앱에서 `OPENGRAZE_PLATFORM_URL` + `OPENGRAZE_PLATFORM_API_KEY`로
 * 동일 계약(`POST /api/v1/events`, `GET /api/v1/meta/limits`)에 붙일 때 사용한다.
 */

export type OpenGrazeIngestEventBody = {
  kind: string;
  data?: Record<string, unknown>;
};

export type OpenGrazeIngestClientOptions = {
  /** 예: https://app.example.com 또는 http://localhost:3000 (끝 슬래시 무시) */
  baseUrl: string;
  /** 대시보드에서 발급한 전체 API 키(og_live_…) */
  apiKey: string;
  /** 테스트·Edge 런타임용 fetch 주입 */
  fetchImpl?: typeof fetch;
};

export interface OpenGrazeIngestClient {
  readonly baseUrl: string;
  /** 원시 Response (상태·헤더·본문 직접 처리) */
  postEvent(body: OpenGrazeIngestEventBody): Promise<Response>;
  /** !res.ok 이면 Error throw, 본문 일부를 메시지에 포함 */
  postEventOrThrow(body: OpenGrazeIngestEventBody): Promise<void>;
  /** 공개 한도 스냅샷 JSON (`GET /api/v1/meta/limits`) */
  getMetaLimits(): Promise<unknown>;
}

function normalizeBase(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function resolveFetch(fn?: typeof fetch): typeof fetch {
  const f = fn ?? globalThis.fetch;
  if (typeof f !== "function") {
    throw new Error(
      "createOpenGrazeIngestClient: fetch가 없습니다. Node 18+ 또는 fetchImpl을 넘기세요.",
    );
  }
  return f as typeof fetch;
}

/**
 * OpenGraze 수집 API 클라이언트. 브라우저·서버·에지 모두에서 사용 가능(순수 fetch).
 */
export function createOpenGrazeIngestClient(
  opts: OpenGrazeIngestClientOptions,
): OpenGrazeIngestClient {
  const base = normalizeBase(opts.baseUrl);
  const fetchFn = resolveFetch(opts.fetchImpl);
  const authHeaders = {
    Authorization: `Bearer ${opts.apiKey}`,
    "Content-Type": "application/json",
  } as const;

  async function postEvent(body: OpenGrazeIngestEventBody): Promise<Response> {
    return fetchFn(`${base}/api/v1/events`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(body),
    });
  }

  async function postEventOrThrow(body: OpenGrazeIngestEventBody): Promise<void> {
    const res = await postEvent(body);
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`OpenGraze ingest HTTP ${res.status}: ${text.slice(0, 500)}`);
    }
  }

  async function getMetaLimits(): Promise<unknown> {
    const res = await fetchFn(`${base}/api/v1/meta/limits`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(
        `OpenGraze meta/limits HTTP ${res.status}: ${text.slice(0, 500)}`,
      );
    }
    return JSON.parse(text) as unknown;
  }

  return {
    baseUrl: base,
    postEvent,
    postEventOrThrow,
    getMetaLimits,
  };
}

/** 대시보드·문서와 동일한 `.env` 두 줄 스니펫 */
export function openGrazePlatformEnvSnippet(baseUrl: string, apiKey: string): string {
  return `OPENGRAZE_PLATFORM_URL=${normalizeBase(baseUrl)}\nOPENGRAZE_PLATFORM_API_KEY=${apiKey}\n`;
}

/**
 * 수집 이벤트 `data` 필드를 표 한 칸·로그 한 줄 요약으로 줄인다.
 * (OpenGraze 대시보드「수집 활동 요약」과 동일 규칙)
 */
export function summarizeIngestPayload(data: unknown): string {
  if (data == null) return "—";
  if (typeof data === "string")
    return data.length > 160 ? `${data.slice(0, 157)}…` : data;
  if (typeof data === "object" && !Array.isArray(data)) {
    const o = data as Record<string, unknown>;
    for (const k of ["message", "title", "note", "path", "summary", "description"]) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) {
        const t = v.trim();
        return t.length > 160 ? `${t.slice(0, 157)}…` : t;
      }
    }
  }
  try {
    const s = JSON.stringify(data);
    return s.length > 160 ? `${s.slice(0, 157)}…` : s;
  } catch {
    return "—";
  }
}
