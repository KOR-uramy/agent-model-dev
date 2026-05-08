# 03 Capability + Business Logic

Action을 실제 수행하는 기능과 규칙 계층이다.  
예: 역할 사이클(기획→구현→검증), 오류 우선 복구 정책, 체크리스트 완료 판정 및 자동 확장 정책.

## Checklist (작성자: 02 Action 단계)

- [x] Action/Need 조회 로직 경로를 `apps/open-graze/lib/ralph-layer-flow.ts`로 단일화한다.
- [x] Need 소스 규칙(`app`/`layer_doc`/`ralph_task`/`empty`)을 타입으로 고정해 UI와 API 응답을 일치시킨다.
- [ ] 다음 핸드오프 규칙: `03`의 미완 체크리스트를 capabilityLogic 본문에 구조화(정책/제약/실패처리)해 노출하는 포맷을 추가한다.
