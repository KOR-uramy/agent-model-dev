# 03 Capability + Business Logic

Action을 실제 수행하는 기능과 규칙 계층이다.  
예: 역할 사이클(기획→구현→검증), 오류 우선 복구 정책, 체크리스트 완료 판정 및 자동 확장 정책.  
구현 단일 근거는 `.codex/ralph-scripts/`이며, `flow.capabilityLogic`은 **이 파일 본문·미완 체크**에서 직접 요약된다.

## Checklist (작성자: 02 Action 단계)

- [ ] Action을 지원하는 기능/모듈/API 경로를 지정한다 (예: `app/api/ralph/layer-flow`, `.codex/ralph-scripts/ralph-loop.sh`).
- [ ] 적용할 비즈니스 규칙(검증 조건, 제한, 실패 처리)을 명시한다.
- [ ] `RALPH_TASK.md`의 루프 정책(자동 확장, 에러 로그 우선)과 스크립트/앱 동작이 어긋나지 않는지 점검한다.
- [ ] 레이어 4~7 담당에게 넘길 usage/presentation 산출 조건이 있으면 한 줄로 남긴다.
