/** 수집 API(`POST /api/v1/events`) 본문 상한 — 남용·대형 페이로드 완화 */

const DEFAULT_MAX_BYTES = 256 * 1024;
const ENV_CAP_BYTES = 10 * 1024 * 1024;

function parseMaxBytes(): number {
  const raw = process.env.INGEST_MAX_BODY_BYTES?.trim();
  if (!raw) return DEFAULT_MAX_BYTES;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_MAX_BYTES;
  return Math.min(n, ENV_CAP_BYTES);
}

export function getIngestMaxBodyBytes(): number {
  return parseMaxBytes();
}

export type ReadLimitedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; error: string };

/**
 * 스트림을 끊까지 읽되 누적 바이트가 상한을 넘으면 413으로 중단한다.
 * Content-Length가 있으면 선제 거절한다.
 */
export async function readJsonBodyLimited(
  req: Request,
): Promise<ReadLimitedJsonResult> {
  const max = getIngestMaxBodyBytes();
  const cl = req.headers.get("content-length");
  if (cl) {
    const declared = Number.parseInt(cl, 10);
    if (Number.isFinite(declared) && declared > max) {
      return { ok: false, status: 413, error: "Request body too large" };
    }
  }

  const stream = req.body;
  if (!stream) {
    return { ok: false, status: 400, error: "Missing body" };
  }

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > max) {
        return { ok: false, status: 413, error: "Request body too large" };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }

  const text = new TextDecoder().decode(merged);
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON" };
  }
}
