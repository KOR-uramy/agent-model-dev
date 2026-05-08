## Agent Thread3 (Layer 08: Release/Deploy/Debug)

### What I changed
- `scripts/open-graze-ops-checklist.sh`의 운영자 체크리스트를 강화했습니다.
  - `OPEN_GRAZE_RELEASE_PORT` 기본값(3000)을 체크리스트 출력에 반영
  - `current` 심볼릭 링크 누락 시 즉시 실패하도록 명시적 에러 처리 추가
  - 체크리스트 완료 마커와 접속 URL 힌트를 추가해 실행 결과를 즉시 판단 가능하게 개선
- `scripts/test-release-ops-invariants.sh`에 체크리스트 정합성 검증을 추가했습니다.
  - ops 체크리스트의 포트 기본값 계약(3000)
  - `current` 심볼릭 링크 누락 시 actionable 메시지
  - 체크리스트 완료 마커 출력

### Files touched
- `scripts/open-graze-ops-checklist.sh`
- `scripts/test-release-ops-invariants.sh`
- `.ralph/parallel/1778241393-78a580b3/agent-thread3.md`

### How to run tests
- 정적 불변식 검증:
  - `sh scripts/test-release-ops-invariants.sh`

### Gotchas
- `scripts/check-open-graze-release-runtime.sh`는 실제 LISTEN 프로세스/포트를 검사하므로, 서버 미기동 상태에서는 실패가 정상입니다.
- `.ralph/errors.log`는 누적 로그가 아니라 최신 매칭 에러 1줄 덮어쓰기입니다.
- 체크리스트는 `current` 심볼릭 링크가 없으면 즉시 실패합니다(의도된 fail-fast 동작).
