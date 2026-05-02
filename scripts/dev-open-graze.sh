#!/bin/sh
# OpenGraze 개발 서버: 기본 포트 3000만 사용. 이미 열려 있으면 먼저 종료한다.
set -eu
ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
sh "$ROOT/scripts/kill-port.sh" 3000
cd "$ROOT"
export PORT=3000
exec npm run dev -w open-graze
