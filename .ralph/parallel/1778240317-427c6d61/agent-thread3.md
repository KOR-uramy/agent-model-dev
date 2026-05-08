## Agent 3 (thread3) 작업 보고서

### What I changed
- Layer 08 요구사항 문서에 운영자 즉시 실행용 체크리스트(복붙 가능한 3개 명령)를 추가해 배포 직후 검증 절차를 명확히 했습니다.
- 릴리스 스크립트(`release-open-graze.sh`)에 동일한 액션 체크리스트를 런타임 컨텍스트 출력 직후 노출하도록 추가했습니다.
- 정적 불변식 테스트(`test-release-ops-invariants.sh`)에 위 체크리스트 출력 존재 여부 검증을 추가해 문서/스크립트/테스트의 일관성을 강화했습니다.

### Files touched
- `apps/open-graze/content/ralph-layers/08_release_deploy_debug.md`
- `scripts/release-open-graze.sh`
- `scripts/test-release-ops-invariants.sh`
- `.ralph/parallel/1778240317-427c6d61/agent-thread3.md`

### How to run tests
- `sh scripts/test-release-ops-invariants.sh`

### Gotchas
- 저장소에 병렬 작업 외 기존 변경사항이 다수 존재하므로, 커밋 시 반드시 파일 단위로 선택 스테이징이 필요합니다.
- 런타임 체크리스트는 릴리스 프로세스가 실제로 떠 있는 상태를 가정합니다. 프로세스 미기동 시 `check-open-graze-release-runtime.sh`는 실패할 수 있습니다.
