# 03 Capability + Business Logic

Action을 실제 수행하는 기능과 규칙 계층이다.  
루프 구현의 기준은 **Codex** 경로 `.codex/ralph-scripts/`이며, `GET /api/ralph/layer-flow`의 `flow.capabilityLogic`는 `ralph-common.sh`에서 역할 사이클·자동 확장 플래그 존재 여부를 짧게 요약한다.

## 근거 & 연동

| 소스 | 역할 |
|------|------|
| `.codex/ralph-scripts/ralph-common.sh` | planning / implementation / test 순환, `RALPH_AUTO_EXPAND_ON_COMPLETE`, 오류 복구 역할 등 |
| `.codex/ralph-scripts/ralph-loop.sh` | 이터레이션·게이트 진입 |
| `apps/open-graze/app/api/ralph/layer-flow/route.ts` | 레이어 md 파싱, 코어 플로우 필드 조합 |
| `.ralph/errors.log` | 유효한 최신 행이 있으면 루프는 일반 체크리스트보다 **오류 복구 우선** (`RALPH_TASK.md`) |

## Checklist (작성자: 02 Action 단계)

- [ ] Action을 지원하는 기능/모듈/스크립트 경로를 지정한다.
- [ ] 적용할 비즈니스 규칙(검증 조건, 제한, 실패 처리)을 명시한다.
- [ ] `ralph_role_for_iteration`(또는 동등 함수)가 3역할 순환을 구현하는지 `ralph-common.sh`에서 확인한다.
- [ ] `RALPH_AUTO_EXPAND_ON_COMPLETE` 분기가 존재하고, 전 체크 완료 시 planning 확장이 기대대로 동작하는지 스크립트를 검토한다.
- [ ] `.ralph/errors.log` 단일 최신 행 정책과 루프의 오류 우선 동작이 문서(`RALPH_TASK.md`)·스크립트·API `flow.releaseDebug`와 모순 없는지 점검한다.
- [ ] `flow.capabilityLogic` 요약 문자열이 실제 `ralph-common.sh` 내용과 어긋나지 않는지(배포 스냅샷에서 파일 누락 시 안내 문구 확인) 검증한다.
