#!/usr/bin/env node
/**
 * OpenGraze 런타임 스모크: 빌드만으로는 잡기 어려운 Turbopack·번들·API 핸들러 오류를
 * 실제 HTTP로 확인한다.
 *
 * 사전: `npm run dev`(또는 `next start`)로 앱이 떠 있고 DB 마이그레이션 완료.
 * 실행: 루트에서 `npm run runtime:smoke`
 * 베이스 URL: `RUNTIME_SMOKE_BASE_URL` (기본 `http://127.0.0.1:3000`)
 */

const base = (
  process.env.RUNTIME_SMOKE_BASE_URL ??
  process.env.OPENGRAZE_PLATFORM_URL ??
  "http://127.0.0.1:3000"
).replace(/\/$/, "");

function exitSkipped(message) {
  console.log(message);
  process.exit(0);
}

const RETRYABLE_HTTP_STATUSES = new Set([500, 502, 503, 504]);
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 700;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, label, accept) {
  let lastResponse = null;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    const response = await fetch(url, { headers: { Accept: accept } });
    lastResponse = response;
    if (!RETRYABLE_HTTP_STATUSES.has(response.status) || attempt === RETRY_ATTEMPTS) {
      return response;
    }
    console.warn(
      `${label}: HTTP ${response.status} (시도 ${attempt}/${RETRY_ATTEMPTS}), 잠시 후 재시도합니다.`,
    );
    await sleep(RETRY_DELAY_MS);
  }
  return lastResponse;
}

async function getJson(path, label) {
  const url = `${base}${path}`;
  let res;
  try {
    res = await fetchWithRetry(url, label, "application/json");
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    exitSkipped(
      `${label}: 요청 실패 (${err}).\n` +
        `  → OpenGraze가 떠 있는지 확인: 다른 터미널에서 루트 \`npm run dev\` (포트 3000).\n` +
        `  → 다른 호스트/포트면: RUNTIME_SMOKE_BASE_URL=https://... npm run runtime:smoke\n` +
        "  → 서버가 없으면 이번 런타임 스모크는 건너뜁니다.",
    );
  }
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    if (RETRYABLE_HTTP_STATUSES.has(res.status)) {
      try {
        await sleep(RETRY_DELAY_MS);
        const retryRes = await fetchWithRetry(url, `${label} (JSON 재확인)`, "application/json");
        const retryText = await retryRes.text();
        json = JSON.parse(retryText);
        if (!retryRes.ok) {
          console.error(`${label}: HTTP ${retryRes.status}`, json);
          process.exit(1);
        }
        return json;
      } catch {
        // final error handling falls through
      }
    }
    console.error(`${label}: HTTP ${res.status}, 본문이 JSON이 아님:\n`, text.slice(0, 500));
    process.exit(1);
  }
  if (!res.ok) {
    console.error(`${label}: HTTP ${res.status}`, json);
    process.exit(1);
  }
  return json;
}

console.log("런타임 스모크 →", base);

const limits = await getJson("/api/v1/meta/limits", "GET /api/v1/meta/limits");
const ingestOk =
  limits?.ingest?.postEvents &&
  typeof limits.ingest.postEvents.maxBodyBytes === "number";
if (!ingestOk) {
  console.error("meta/limits 응답 형식이 예상과 다릅니다:", limits);
  process.exit(1);
}
console.log("  ✓ meta/limits");

const eventsPayload = await getJson("/api/ralph/events?tail=5", "GET /api/ralph/events");
if (
  typeof eventsPayload.workspace !== "string" ||
  !Array.isArray(eventsPayload.events) ||
  eventsPayload.summary == null ||
  typeof eventsPayload.summary !== "object"
) {
  console.error("ralph/events 페이로드 형식 오류:", Object.keys(eventsPayload));
  process.exit(1);
}
console.log("  ✓ ralph/events (tail=5)");

await getJson("/api/ralph/events?tail=3&role=planning", "GET /api/ralph/events role=planning");
console.log("  ✓ ralph/events (role=planning)");

const now = Date.now();
const fromIso = new Date(now - 7 * 86400000).toISOString();
const toIso = new Date(now).toISOString();
const rangePath = `/api/ralph/events/range?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}&limit=100`;
const rangePayload = await getJson(
  rangePath,
  "GET /api/ralph/events/range",
);
if (
  !Array.isArray(rangePayload.events) ||
  typeof rangePayload.truncated !== "boolean" ||
  typeof rangePayload.returnedCount !== "number" ||
  rangePayload.returnedCount !== rangePayload.events.length
) {
  console.error(
    "ralph/events/range: events·truncated·returnedCount 형식 오류:",
    Object.keys(rangePayload),
  );
  process.exit(1);
}
console.log("  ✓ ralph/events/range (7d window)");

const rangeRole = await getJson(
  `${rangePath}&role=planning`,
  "GET /api/ralph/events/range role=planning",
);
if (!Array.isArray(rangeRole.events)) {
  console.error("ralph/events/range+role 페이로드 형식 오류");
  process.exit(1);
}
console.log("  ✓ ralph/events/range (7d window, role=planning)");

let llmsRes;
try {
  llmsRes = await fetch(`${base}/llms.txt`, { headers: { Accept: "text/plain" } });
} catch (e) {
  const err = e instanceof Error ? e.message : String(e);
  console.error(`GET /llms.txt 실패: ${err}`);
  process.exit(1);
}
if (!llmsRes.ok) {
  console.error(`GET /llms.txt HTTP ${llmsRes.status}`);
  process.exit(1);
}
const llmsText = await llmsRes.text();
if (llmsText.length < 20) {
  console.error("llms.txt 내용이 비정상적으로 짧음");
  process.exit(1);
}
console.log("  ✓ llms.txt");

console.log("\n런타임 스모크 전부 통과.");
