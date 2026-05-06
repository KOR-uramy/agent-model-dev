# Agent thread3 — Layer 08 Release/Deploy/Debug

## What changed

- **`scripts/release-open-graze.sh`**: `PORT`와 `OPEN_GRAZE_RELEASE_PORT` 정렬을 검증하는 불변식 가드 추가. 기동 직전 **Layer 08 context** 블록을 출력해 포트·스냅샷 경로·`current` 심볼릭 링크·`next start`/`NODE_ENV`·`.ralph/errors.log` 신호 경로를 한눈에 확인 가능하게 함.
- **`scripts/test-release-ops-invariants.sh`**: `NODE_ENV=production`, `PORT` export, `current` 심볼릭 링크 갱신, 포트 가드 문자열에 대한 정적 grep 추가. `runtime-error-monitor.sh`에 대한 **임시 워크스페이스** 기반 행동 테스트(에러 줄 덮어쓰기, 누적 금지) 추가.
- **`apps/open-graze/content/ralph-layers/08_release_deploy_debug.md`**: Ops 체크리스트를 단계별 실행 순서·기대 출력·요약 표로 정리해 실제 운영 절차와 문서를 일치시킴.

## Files touched

- `scripts/release-open-graze.sh`
- `scripts/test-release-ops-invariants.sh`
- `apps/open-graze/content/ralph-layers/08_release_deploy_debug.md`
- `.ralph/parallel/1778081492-4cd3d244/agent-thread3.md` (this report)

## How to run tests

```sh
cd /path/to/repo
sh scripts/test-release-ops-invariants.sh
```

(선택) 전체 릴리스 플로우는 빌드가 필요하므로: `npm run build -w open-graze` 후 `npm run release:open-graze` — 장시간 서버 프로세스가 붙음.

## Gotchas

- `release-open-graze.sh`는 **포그라운드**로 `next start`를 붙잡는다(파이프로 에러 모니터 통과). CI에서는 불변식 테스트만 돌리고, 풀 스택 기동은 로컬/스테이징에서 수행하는 편이 안전하다.
- `.ralph/errors.log`는 **항상 한 줄만** 유지된다. “로그 테일”이 아니라 **마지막 매칭 에러 한 줄**이 계약이다.
- `readlink`는 macOS에서 `-f` 없이 동작하도록 단순 `readlink`만 사용했다; 심볼릭 링크가 깨지면 `?`로 표시된다.
