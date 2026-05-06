# Ralph Task: Nova Hub — Ralph Loop (단일 근거)

이 파일만 과제·구조의 단일 근거다. **두 번째 `# Ralph Task` 블록이나 과거 스프린트 본문을 이 파일 끝에 붙이지 않는다.** 확장은 기존 섹션 안의 `- [ ]`만 추가한다.

## Goal

Nova Hub(`apps/open-graze`)와 Ralph 루프·시각화를 아래 **8단계 개념 모델**로 맞춘다.

- 핵심 흐름: `Need → Action → Capability+Business Logic → Usage Data → Presentation Builder → Presentation Data → UI`
- 운영 레이어(8단계): `Release / Deploy / Debug`
- 각 단계 **작업 트리거**: 직전 단계가 해당 단계용 md에 남긴 **미완 체크리스트 `[ ]`**
- Need(1단계)만 예외: 루프·과제 입력 자체가 트리거

## Layer Model (1~8)

| 단계 | 이름 |
|------|------|
| 1 | Need |
| 2 | Action |
| 3 | Capability + Business Logic |
| 4 | Usage Data |
| 5 | Presentation Builder |
| 6 | Presentation Data |
| 7 | UI |
| 8 | Release / Deploy / Debug |

## Parallel Threads

- **Core**: 단계 1~3 (한 흐름으로 묶어 운영)
- **Presentation**: 단계 4~7 (별도 생명주기, Core와 병렬로 운영)
- **Ops**: 단계 8 (배포·디버깅; Core/Presentation의 체크리스트·산출을 근거로 게이트)

## Loop Policy (역할 파이프)

- 사이클: `planning → implementation → test` (3단계만)
- `RALPH_ROLE_MODE=cycle` 기본
- `RALPH_TASK.md`의 목록 체크박스가 **모두 `[x]`**여도 종료하지 않고, **planning**에서 새 `- [ ]`를 추가해 다음 라운드로 이어간다
- 자동 확장: `RALPH_AUTO_EXPAND_ON_COMPLETE=1` (끄려면 `0`)

## Deployment & Runtime Error

- 배포 포트: **항상 3000**
- 실행: **빌드 산출물만** (`next start`)
- 실행 디렉터리: **immutable release snapshot** (작업 트리 핫픽스가 live에 반영되지 않게)
- 런타임 에러: `scripts/runtime-error-monitor.sh` → `.ralph/errors.log`
- `errors.log`: **누적 금지**, **최신 1건만** 유지(덮어쓰기)
- `.ralph/errors.log`에 유효한 최신 행이 있으면 루프는 **오류 복구 우선**(일반 체크리스트보다 앞)

## Source of Truth Paths

| 영역 | 위치 |
|------|------|
| 루프 구현(기준) | `.codex/ralph-scripts/` |
| Cursor shim(선택) | `.cursor/ralph-scripts/` → 위와 동일 스크립트 위임 |
| 앱 | `apps/open-graze` |
| 레이어 md (파일명 정렬) | `apps/open-graze/content/ralph-layers/*.md` |
| 진행·에러·활동 | `.ralph/progress.md`, `.ralph/errors.log`, `.ralph/activity.log` |
| 릴리스 스냅샷 | `.release/open-graze/` (스크립트가 생성) |

## Agent 규칙 (문서 보호)

- `RALPH_TASK.md`를 **전면 붙여넣기·구 버전 병합**하지 않는다. 변경은 **최소 diff**만.
- 커밋 후 **`git push`**로 원격에 반영한다(루프 프롬프트와 동일).

## Success Criteria

### 문서·정합

- [ ] 이 파일에 `# Ralph Task` 제목이 **한 번만** 있고, 아래에 구버전 OpenGraze 단일 태스크 본문이 **붙어 있지 않다**
- [ ] 레이어 1~8, 트리거 규칙, 병렬 스레드, 배포·에러 정책이 앱(`layer-flow`·showcase)·스크립트와 어긋나지 않는다

### 루프

- [ ] `./.codex/ralph-scripts/ralph-loop.sh -y` 가 배너 직후 **즉시 종료하지 않고** 이터레이션이 진행된다
- [ ] 이터 헤더에 전체 흐름(`Flow map`)과 역할별 구간(`Flow now`)이 보인다
- [ ] 전 체크 완료 시 planning 자동 확장으로 새 `[ ]`가 생긴다

### 앱·API

- [ ] `GET /api/ralph/layer-flow` 가 need/action/capability/usage/presentation/ui/**releaseDebug** 를 실데이터로 반환한다
- [ ] 시각화 UI에 8단계·스레드(core/presentation/ops)·**최신 런타임 에러**가 보인다

### 배포·운영

- [ ] `npm run release:open-graze` 가 포트 3000·snapshot·`next start`·에러 모니터 파이프를 만족한다
- [ ] snapshot 실행 시 `RALPH_WORKSPACE_ROOT` 등으로 **워크스페이스 루트**의 `.ralph/errors.log`를 읽는다

### 검증

- [ ] 루트 `npm run build` 통과
- [ ] 서버 기동 후 `npm run runtime:smoke` 통과

## Notes

- 구현 기준은 **Codex** 경로; Cursor 경로는 shim일 뿐이다.
- 활성 런타임/빌드 오류가 있으면 신기능보다 **복구**를 우선한다.
