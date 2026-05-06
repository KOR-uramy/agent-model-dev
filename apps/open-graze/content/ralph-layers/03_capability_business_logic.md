# 03 Capability + Business Logic

Action을 실제 수행하는 기능과 규칙 계층이다.  
예: 역할 사이클(기획→구현→검증), 오류 우선 복구 정책, 체크리스트 완료 판정 및 자동 확장 정책.

**병렬 스레드**: **Core(1~3)**. 트리거는 `02_action.md`에 남긴 미완 체크리스트.

**구현·정책 근거(코드)**:

- 루프·역할·자동 확장: `.codex/ralph-scripts/ralph-common.sh`, `ralph-loop.sh`(Codex 경로가 단일 구현 기준).
- 앱에서의 요약 노출: `GET /api/ralph/layer-flow` → `flow.capabilityLogic`(위 스크립트를 읽어 한 줄 요약).
- 런타임 에러 우선: `.ralph/errors.log` 최신 1건이 있으면 일반 체크리스트보다 앞선다(`RALPH_TASK.md` Deployment & Runtime Error).

## Checklist (작성자: 02 Action 단계)

- [ ] Action을 지원하는 기능/모듈/스크립트 경로를 지정한다.
- [ ] 적용할 비즈니스 규칙(검증 조건, 제한, 실패 처리)을 명시한다.
- [ ] `RALPH_ROLE_MODE`(기본 `cycle`)와 planning→implementation→test 3역할 파이프가 이번 변경과 모순 없는지 확인한다.
- [ ] `RALPH_AUTO_EXPAND_ON_COMPLETE` 동작이 “전 체크 완료 후 planning 확장” 요구와 맞는지 확인한다.
- [ ] `layer-flow` 응답의 `orchestration.coreThread`에 need/action/capability 키가 빠짐없이 포함되는지 점검한다.
