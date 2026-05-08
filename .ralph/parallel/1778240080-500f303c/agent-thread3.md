## Agent 3 (thread3) 작업 보고서

### What I changed
- Layer 08 릴리스 스크립트(`scripts/release-open-graze.sh`)에 운영자가 즉시 실행할 수 있는 후속 점검 명령(`POST_DEPLOY_CHECK=sh scripts/check-open-graze-release-runtime.sh`)을 노출해 배포/디버그 루프를 고정했습니다.
- 신규 런타임 체크 스크립트(`scripts/check-open-graze-release-runtime.sh`)를 추가해 다음을 자동 검증하도록 했습니다.
  - `OPEN_GRAZE_RELEASE_PORT` 기본값 3000 기준 LISTEN 프로세스 존재
  - LISTEN 프로세스가 `next start`로 실행 중인지
  - 프로세스 cwd가 `.release/open-graze/current`가 가리키는 스냅샷 실체와 일치하는지
  - `.ralph/errors.log` 최신 신호(있을 경우) 태그 가시성
- 불변식 테스트(`scripts/test-release-ops-invariants.sh`)를 보강해 신규 체크리스트 스크립트 존재/실행권한/핵심 검증 항목을 회귀 검증에 포함했습니다.
- Layer 08 문서(`apps/open-graze/content/ralph-layers/08_release_deploy_debug.md`)에 "런타임 체크리스트 (기동 직후 10초)" 섹션을 추가해 실행형 운영 절차를 명시했습니다.

### Files touched
- `scripts/release-open-graze.sh`
- `scripts/check-open-graze-release-runtime.sh` (new)
- `scripts/test-release-ops-invariants.sh`
- `apps/open-graze/content/ralph-layers/08_release_deploy_debug.md`
- `.ralph/parallel/1778240080-500f303c/agent-thread3.md` (this report)

### How to run tests
- 정적/행동 불변식 검증:
  - `sh scripts/test-release-ops-invariants.sh`
- 릴리스 프로세스 기동 후 런타임 운영 체크:
  - `sh scripts/check-open-graze-release-runtime.sh`

### Gotchas
- 런타임 체크 스크립트는 `lsof`/`ps`에 의존합니다(로컬 macOS/Linux 운영자 환경 기준).
- `.ralph/errors.log`는 "에러가 발생했을 때만" 갱신되므로, 파일이 비어 있으면 경고로 처리하고 실패시키지 않습니다.
- `RUNTIME_ERROR_SIGNAL_TAG`를 커스텀한 경우, 체크 스크립트에도 동일 태그 환경변수를 넘겨야 태그 검증이 일치합니다.
