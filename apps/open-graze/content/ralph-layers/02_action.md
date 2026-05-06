# 02 Action

Need를 충족하기 위한 구체 행동을 정의한다.  
일반 루프에서는 `.ralph/progress.md`의 최신 진행 메모나 현재 이터 목표에서 Action 근거를 읽는다.

**병렬 에이전트 모드**에서는 `progress.md`를 동시에 수정하지 않을 수 있으므로, 근거로 **오케스트레이터가 준 이터 목표** 또는 **01 Need 체크리스트에서 이미 적어 둔 다음 행동**을 우선 사용한다.

`GET /api/ralph/layer-flow`의 `flow.action`은 기본적으로 progress 마지막 유효 줄을 보여 준다(파일이 없으면 안내 문구).

## Checklist (작성자: 01 Need 단계)

- [ ] Need를 충족하기 위한 실행 가능한 Action 1~3개를 적는다.
- [ ] 각 Action이 어느 역할(기획 plan / 구현 impl / 검증 test)에서 처리될지 태깅한다.
- [ ] Action 근거 출처를 한 줄로 밝힌다(`progress.md` 최신 줄 / 병렬 모드 시 과제 브리프 / Need 체크리스트 등).
- [ ] 트리거 규칙: 다음 단계(03)는 **이 md에 남은 미완 `[ ]`**를 보고 Capability 작업을 시작한다는 점을 확인한다.
