#!/bin/sh
# LISTEN 중인 TCP 포트의 프로세스만 종료 (macOS / Linux lsof).
# 사용: sh scripts/kill-port.sh 3000

set -eu
PORT="${1:?포트 번호 필요 (예: sh scripts/kill-port.sh 3000)}"

if ! command -v lsof >/dev/null 2>&1; then
  echo "kill-port: lsof 가 없습니다. 포트 $PORT 를 수동으로 비우세요." >&2
  exit 0
fi

pids=$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null || true)
if [ -z "$pids" ]; then
  echo "kill-port: $PORT LISTEN 프로세스 없음"
  exit 0
fi

echo "kill-port: TCP $PORT -> $pids 종료"
for pid in $pids; do
  kill "$pid" 2>/dev/null || true
done
