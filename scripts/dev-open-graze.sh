#!/bin/sh
# OpenGraze 개발 서버: 기본 포트 3000만 사용. 이미 열려 있으면 먼저 종료한다.
set -eu
ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
sh "$ROOT/scripts/kill-port.sh" 3000
cd "$ROOT"
# 루트 .env → apps/open-graze/.env 순(나중이 우선). Next가 앱 디렉터리 기준으로만 .env 를 읽을 때
# 루트에만 둔 AUTH_SECRET 등이 빠지는 경우를 막는다.
set -a
[ -f "$ROOT/.env" ] && . "$ROOT/.env"
[ -f "$ROOT/apps/open-graze/.env" ] && . "$ROOT/apps/open-graze/.env"
set +a
export PORT=3000
exec npm run dev -w open-graze
