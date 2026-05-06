# Agent thread3 (Layer 08 — Release/Deploy/Debug)

## What changed

- **릴리스 기동**: `next start`의 `-p` 인자를 `OPEN_GRAZE_RELEASE_PORT` 대신 이미 검증된 `PORT`와 동일하게 두어, 포트 단일 소스(export `PORT` + `kill-port`)와 일치시킴.
- **불변식 테스트**: `test-release-ops-invariants.sh`에 스냅샷 `cd`, `RALPH_WORKSPACE_ROOT`, Layer 08 콘솔 훅, `.ralph/errors.log` 언급, `next start -p "${PORT}"`, 모니터 기본 태그 `runtime-release`에 대한 정적 검사 추가.
- **요구사항 문서**: `08_release_deploy_debug.md`에 운영자용 **장애 디버그 빠른 절차** 섹션과 요약 표에 `PORT`/`next start -p` 정렬 한 줄 보강.

## Files touched

- `scripts/release-open-graze.sh`
- `scripts/test-release-ops-invariants.sh`
- `apps/open-graze/content/ralph-layers/08_release_deploy_debug.md`
- `.ralph/parallel/1778081690-0b71c37d/agent-thread3.md` (본 보고서)

## How to run tests

- 저장소 루트에서:

```sh
sh scripts/test-release-ops-invariants.sh
```

- 기대: `OK: release ops invariants (...)` 한 줄, exit code 0.

## Gotchas

- **package.json 등 잠금 파일은 수정하지 않음** (병렬 작업 제약). 릴리스 실행은 기존 `npm run release:open-graze` 그대로.
- **로컬 릴리스 스모크**는 빌드·포트 점유·장시간 서버이므로 CI 대신 위 정적 스크립트로 계약을 검증하는 편이 안전함.
- **`RALPH_WORKSPACE_ROOT`**는 스냅샷 cwd가 아니라 리포 루트를 가리킴; 디버그 시 경로 혼동 주의.
- **`.ralph/progress.md`**는 터치하지 않음(병렬 머지 충돌 방지).
- **병렬 보고서 경로** `.ralph/parallel/`는 `.gitignore`에 있을 수 있음 → 커밋 시 `git add -f .ralph/parallel/1778081690-0b71c37d/agent-thread3.md` 필요할 수 있음.
