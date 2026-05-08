## Agent 3 (thread3) 작업 보고서

### 무엇을 변경했는가
- Layer 08 릴리스 파이프라인의 스냅샷 불변성 강화를 위해 `scripts/release-open-graze.sh`에서 스냅샷 경로가 이미 존재하면 즉시 실패하도록 가드(재사용 금지)를 추가했습니다.
- 운영자 즉시 점검을 한 번에 실행할 수 있도록 `scripts/open-graze-ops-checklist.sh`를 새로 추가했습니다.
- 릴리스 스크립트의 콘솔 안내(`Actionable ops checklist`)에 신규 체크리스트 스크립트 실행 명령을 추가했습니다.
- `scripts/test-release-ops-invariants.sh`를 업데이트해 신규 체크리스트 존재/실행권한/핵심 명령 포함 여부와 스냅샷 경로 중복 방지 가드를 검증하도록 확장했습니다.
- Layer 08 문서(`08_release_deploy_debug.md`)의 운영자 복붙 절차를 신규 one-shot 체크리스트 기준으로 정리했습니다.

### 수정한 파일
- `scripts/release-open-graze.sh`
- `scripts/open-graze-ops-checklist.sh` (신규)
- `scripts/test-release-ops-invariants.sh`
- `apps/open-graze/content/ralph-layers/08_release_deploy_debug.md`
- `.ralph/parallel/1778240914-457c0068/agent-thread3.md` (본 보고서)

### 테스트 실행 방법
- 저장소 루트에서 아래 명령 실행:
  - `sh scripts/test-release-ops-invariants.sh`

### 테스트 결과
- 통과:
  - `OK: release ops invariants (port 3000 default, next start, snapshot, error signal loop, runtime checklist)`

### Gotchas
- 현재 시스템 디스크 여유 공간이 매우 낮아(`no space left on device` 경고 관찰) 릴리스 스냅샷 생성/빌드 시 실패 가능성이 있습니다.
- `scripts/open-graze-ops-checklist.sh`는 런타임 검증을 포함하므로, 실제 릴리스 프로세스가 떠 있지 않으면 `check-open-graze-release-runtime.sh` 단계에서 실패합니다.
