# Agent thread3 — Layer 08 Release/Deploy/Debug

## 변경 요약

- **`scripts/runtime-error-monitor.sh`**: `[[ =~ ]]`(Bash 전용)를 제거하고, 에러 매칭을 `_ERROR_PATTERN` 단일 ERE와 `grep -E`로 처리해 `sh` 호출과 문서·테스트 간 계약을 맞춤.
- **`apps/open-graze/content/ralph-layers/08_release_deploy_debug.md`**: 빌드→스냅샷→포트→`next start`→에러 모니터 순서를 표로 정리하고, 패턴 미매칭·파이프 단절·`lsof` 확인 등 운영 gotcha를 추가.
- **`scripts/test-release-ops-invariants.sh`**: `_ERROR_PATTERN` 존재를 정적 검증에 포함.

`scripts/release-open-graze.sh`는 이미 포트 3000 기본값, `next start`, 불변 스냅샷, `runtime-error-monitor` 파이프를 만족해 로직 변경 없음.

## 수정한 파일

- `scripts/runtime-error-monitor.sh`
- `apps/open-graze/content/ralph-layers/08_release_deploy_debug.md`
- `scripts/test-release-ops-invariants.sh`
- `.ralph/parallel/1778082002-40ab5303/agent-thread3.md` (본 보고서)

## 테스트 실행

저장소 루트에서:

```sh
sh scripts/test-release-ops-invariants.sh
```

기대: `OK: release ops invariants (...)` 한 줄, exit code 0.

(선택) Layer 08 문서의 “최소 검증” 블록을 붙여 넣어 grep·tail까지 한 번에 확인 가능.

## Gotchas

- `.ralph/parallel/`는 `.gitignore`에 포함될 수 있음. 보고서를 커밋할 때는 `git add -f .ralph/parallel/1778082002-40ab5303/agent-thread3.md`처럼 강제 스테이징이 필요할 수 있음.
- `.ralph/progress.md`, `RALPH_TASK.md`는 수정하지 않음(병렬 작업 지침).
- `package.json` 등 머지 충돌 다발 파일은 건드리지 않음.
- `errors.log`는 **패턴에 매칭되는 줄**이 있을 때만 덮어씀; 새 로그 포맷은 `_ERROR_PATTERN` 확장이 필요함.
- `release-open-graze.sh`는 `npm run`으로 빌드하므로, 로컬에서 해당 테스트만 할 때는 `node_modules`가 이미 설치돼 있어야 함(불변 테스트 스크립트는 빌드 없이 grep·모니터 동작만 검사).
