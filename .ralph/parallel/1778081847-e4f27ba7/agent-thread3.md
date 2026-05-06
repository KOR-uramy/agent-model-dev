# Agent thread3 (Layer 08 — Release/Deploy/Debug)

## What changed

- **릴리스 러너 (`release-open-graze.sh`)**: Layer 08 콘솔 블록에 기본 포트 3000·불변 스냅샷 cwd·프로덕션 전용(개발 모드 비사용) 안내를 명시하고, `DEBUG_ROOT=$RALPH_WORKSPACE_ROOT` 한 줄을 추가해 스냅샷 cwd와 리포 루트를 혼동하지 않도록 함.
- **불변식 테스트 (`test-release-ops-invariants.sh`)**: `.ralph/errors.log`가 **정확히 한 줄**인지 검사, 에러 패턴이 없는 stdin 이후에도 한 줄이 유지되는지 검사, 위 릴리스 출력 필드에 대한 정적 grep 보강.
- **요구사항 문서 (`08_release_deploy_debug.md`)**: 약 30초짜리 **터미널 붙여넣기 최소 검증** 블록 추가(정적 테스트 + 포트 기본값 grep + `errors.log` 마지막 줄 확인).

## Files touched

- `scripts/release-open-graze.sh`
- `scripts/test-release-ops-invariants.sh`
- `apps/open-graze/content/ralph-layers/08_release_deploy_debug.md`
- `.ralph/parallel/1778081847-e4f27ba7/agent-thread3.md` (본 보고서)

## How to run tests

저장소 루트에서:

```sh
sh scripts/test-release-ops-invariants.sh
```

기대: `OK: release ops invariants (...)` 한 줄, exit code 0.

## Gotchas

- **`.gitignore`**: `.ralph/*`가 무시되므로 병렬 보고서는 `git add -f .ralph/parallel/1778081847-e4f27ba7/agent-thread3.md`로 스테이징해야 할 수 있음.
- **`next dev` 정적 검사**: 릴리스 스크립트 본문에 리터럴 `next dev` 문자열이 있으면 테스트가 실패함(실제 기동 금지 계약). 운영자 안내 문구는 `production only, never dev mode`처럼 우회함.
- **`package.json` / 잠금 파일**: 병렬 작업 제약으로 수정하지 않음. 릴리스는 기존 `npm run release:open-graze` 유지.
- **`.ralph/progress.md`**: 터치하지 않음(병렬 머지 충돌 방지).
