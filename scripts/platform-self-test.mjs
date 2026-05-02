#!/usr/bin/env node
/**
 * OpenGraze 앱에 이 모노레포를 "클라이언트 앱"으로 등록한 뒤,
 * 발급한 API 키로 수집 파이프를 스모크 테스트합니다.
 *
 * 사전: `npm run dev`(open-graze) + 대시보드에서 워크스페이스·API 키 생성.
 * 실행: 루트에 `.env` 또는 셸에서 OPENGRAZE_PLATFORM_API_KEY 설정 후
 *   npm run platform:self-test
 */

const base = (
  process.env.OPENGRAZE_PLATFORM_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
const token = process.env.OPENGRAZE_PLATFORM_API_KEY?.trim();

if (!token) {
  console.error(
    "OPENGRAZE_PLATFORM_API_KEY 가 비어 있습니다.\n" +
      "대시보드 → 워크스페이스 → API 키 생성 후 og_live_... 전체를 넣으세요.\n" +
      "예: export OPENGRAZE_PLATFORM_API_KEY='og_live_...'",
  );
  process.exit(1);
}

const url = `${base}/api/v1/events`;
const body = {
  kind: "opengraze.self_test",
  data: {
    note: "agent-model-dev monorepo self-test",
    ts: new Date().toISOString(),
  },
};

const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const text = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status}`, text);
  process.exit(1);
}

console.log("수집 성공:", text);
console.log(
  "대시보드에서 해당 워크스페이스 → 이벤트 목록을 새로고침해 kind `opengraze.self_test` 를 확인하세요.",
);
