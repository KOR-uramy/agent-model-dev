# 01 Need

명시적 요구사항/목표를 정의한다.  
실행 기준은 `RALPH_TASK.md`의 미완 `[ ]` 항목이며, 현재 루프가 해결해야 할 핵심 Need를 한 줄로 표현한다.  
Core 스레드(1~3)의 시작점: **Need만** 루프·과제 입력만으로 트리거되고, 이후 단계는 전단계 md의 미완 체크가 트리거다.

## Checklist (전단계 입력 없음: 시작점)

- [ ] 현재 루프의 최우선 Need를 한 줄로 명시한다.
- [ ] Need가 측정 가능한 성공 조건(`RALPH_TASK.md` Success Criteria의 해당 `[ ]`)과 연결되는지 확인한다.
- [ ] 이번 라운드에서 Core(1~3) 범위인지, Presentation/Ops에 넘길 일은 없는지 구분한다.
- [ ] 다음 핸드오프가 `GET /api/ralph/layer-flow`의 `flow.need`·`orchestration.coreThread`와 모순 없이 읽히는지 확인한다.
