/**
 * 환경 변수 키 — stream-parser의 `RALPH_EVENTS_JSONL`과 동일한 이름을 씁니다.
 * 다른 저장소에서도 이 상수만 맞추면 경로가 일치합니다.
 */
export const RALPH_ENV_KEYS = {
  WORKSPACE: "RALPH_WORKSPACE",
  EVENTS_JSONL: "RALPH_EVENTS_JSONL",
  USD_PER_MILLION_EST_TOKENS: "RALPH_USD_PER_MILLION_EST_TOKENS",
} as const;

/** OpenGraze / 앱 작업량 로그 (`stream-parser`와 별도 파일) */
export const OPENGRAZE_ENV_KEYS = {
  TELEMETRY_JSONL: "OPENGRAZE_TELEMETRY_JSONL",
  /** 여러 앱이 같은 파일에 쓸 때 구분용 라벨 */
  WORKSPACE_KEY: "OPENGRAZE_WORKSPACE_KEY",
} as const;
