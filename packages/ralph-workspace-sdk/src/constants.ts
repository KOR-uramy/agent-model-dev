/**
 * 환경 변수 키 — stream-parser의 `RALPH_EVENTS_JSONL`과 동일한 이름을 씁니다.
 * 다른 저장소에서도 이 상수만 맞추면 경로가 일치합니다.
 */
export const RALPH_ENV_KEYS = {
  WORKSPACE: "RALPH_WORKSPACE",
  EVENTS_JSONL: "RALPH_EVENTS_JSONL",
  USD_PER_MILLION_EST_TOKENS: "RALPH_USD_PER_MILLION_EST_TOKENS",
} as const;
