# 01 Need

명시적 요구사항/목표를 정의한다.  
실행 기준은 `RALPH_TASK.md`의 미완 `[ ]` 항목이며, 현재 루프가 해결해야 할 핵심 Need를 한 줄로 표현한다.

**병렬 스레드**: 이 단계는 **Core(1~3)** 에 속한다. Need만 예외적으로 “전단계 md 체크리스트”가 아니라 **루프·과제 입력**이 트리거다(`RALPH_TASK.md` Goal).

**근거 파일**: 워크스페이스 루트의 `RALPH_TASK.md`(단일 근거). 시각화 API는 여기서 첫 미완 `[ ]` 한 줄을 `flow.need`로 노출한다.

## Checklist (전단계 입력 없음: 시작점)

- [ ] 현재 루프의 최우선 Need를 한 줄로 명시한다.
- [ ] Need가 측정 가능한 성공 조건(`RALPH_TASK.md` Success Criteria의 해당 `[ ]`)과 연결되는지 확인한다.
- [ ] `RALPH_TASK.md` 본문에 `# Ralph Task` 제목이 한 번만 있고, 중복 블록이 붙어 있지 않은지 확인한다.
- [ ] Core(1~3) 범위 작업이 Presentation(4~7)·Ops(8) 담당과 경계가 겹치지 않는지 한 줄로 적는다.
- [ ] 다음 에이전트가 `02_action.md`에 옮길 Action 후보를 Need 관점에서 1문장으로 메모한다.
