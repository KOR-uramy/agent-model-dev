# 03 Capability + Business Logic

Action을 실제 수행하는 기능과 규칙 계층이다.  
예: 역할 사이클(기획→구현→검증), 오류 우선 복구 정책, 체크리스트 완료 판정 및 자동 확장 정책.

## Checklist (작성자: 02 Action 단계)

- [x] Action/Need 조회 로직 경로를 `apps/open-graze/lib/ralph-layer-flow.ts`로 단일화한다.
- [x] Need 소스 규칙(`app`/`layer_doc`/`ralph_task`/`empty`)을 타입으로 고정해 UI와 API 응답을 일치시킨다.
- [x] `03`의 미완 체크리스트를 capabilityLogic 본문에 정책(policy)/제약(constraints)/실패처리(errorHandling) 3축으로 구조화한 `flow.capabilityLogicStructured`를 layer-flow 응답에 추가한다(`flow.capabilityLogic` 문자열은 백워드 호환을 위해 유지).
- [x] 다음 핸드오프 규칙: `flow.capabilityLogicStructured.errorHandling`이 `.ralph/errors.log` 활성 신호 유무에 따라 동적으로 바뀌도록 정책을 확장해 활성 에러 발생 시 우선 복구 문구를 명시한다.
- [x] 다음 핸드오프 규칙: `flow.capabilityLogicStructured.errorHandling`을 레이어 8(`releaseDebug`) 신호와 결합해 복구 우선 단계(탐지→분류→복구→검증)를 명시하는 정책 문구를 추가한다.
- [ ] 다음 핸드오프 규칙: `releaseDebug` 메시지를 구조화된 필드(`severity`/`category`/`summary`)로 분리해 03 정책과 08 운영 UI가 동일 기준으로 해석하도록 맞춘다.
