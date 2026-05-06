# 01 Need

명시적 요구사항/목표를 정의한다.  
실행 기준은 `RALPH_TASK.md`의 미완 `[ ]` 항목이며, 현재 루프가 해결해야 할 핵심 Need를 한 줄로 표현한다.

## 실데이터 매핑 (Core 1/3)

- 시각화: `GET /api/ralph/layer-flow` 응답의 `flow.need`.
- 근거 파일: 워크스페이스 루트의 `RALPH_TASK.md`에서 **첫 번째** 미완 체크 항목(`- [ ]` 또는 `* [ ]`, 번호 목록 형식 포함) 한 줄의 본문.
- 예외 규칙: Need(1단계)만 직전 단계 md 트리거 없이 **루프·과제 입력**이 트리거다(`RALPH_TASK.md` 참조).

## Checklist (전단계 입력 없음: 시작점)

- [ ] 현재 루프의 최우선 Need를 한 줄로 명시한다.
- [ ] Need가 측정 가능한 성공 조건(`RALPH_TASK.md` Success Criteria의 해당 `[ ]`)과 연결되는지 확인한다.
- [ ] `flow.need`에 표시된 문구가 `RALPH_TASK.md` 첫 미완 `[ ]`와 동일한지(또는 의도적으로 다를 이유가 있는지) 확인한다.
- [ ] Core(1~3) 범위의 Need가 Presentation(4~7)·Ops(8) 담당과 역할이 겹치지 않는지 확인한다.
