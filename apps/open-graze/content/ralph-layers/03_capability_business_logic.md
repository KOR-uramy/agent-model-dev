# 03 Capability + Business Logic

Action을 실제 수행하는 기능과 규칙 계층이다.  
예: 역할 사이클(기획→구현→검증), 오류 우선 복구 정책, 체크리스트 완료 판정 및 자동 확장 정책.

## 실데이터 매핑 (Core 3/3)

- 시각화: `GET /api/ralph/layer-flow` 응답의 `flow.capabilityLogic`.
- 근거: `.codex/ralph-scripts/ralph-common.sh`를 읽어 `ralph_role_for_iteration`(기획/구현/검증 3분기)와 `RALPH_AUTO_EXPAND_ON_COMPLETE:-1` 기본 동작을 요약한다. 파일이 없으면 오류 안내 문구만 반환한다.
- 루프 정책 단일 근거: `RALPH_TASK.md`의 Loop Policy·Deployment & Runtime Error와 스크립트 구현이 어긋나지 않아야 한다.

## Checklist (작성자: 02 Action 단계)

- [ ] Action을 지원하는 기능/모듈/스크립트 경로를 지정한다(예: `.codex/ralph-scripts/ralph-loop.sh`, `apps/open-graze/...`).
- [ ] 적용할 비즈니스 규칙(검증 조건, 제한, 실패 처리)을 명시한다.
- [ ] `flow.capabilityLogic` 요약이 `ralph-common.sh`의 역할 순환·자동 확장 분기와 모순되지 않는지 확인한다.
- [ ] `.ralph/errors.log`에 유효한 최신 행이 있을 때 루프가 일반 체크리스트보다 **오류 복구 우선**인지 스크립트와 문서를 대조한다.
