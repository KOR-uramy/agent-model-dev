# 02 Action

Need를 충족하기 위한 구체 행동을 정의한다.  
우선순위가 가장 높은 Action은 이 문서의 미완 `[ ]` 항목이며, core thread는 이를 그대로 실행 입력으로 사용한다.

## Checklist (작성자: 01 Need 단계)

- [x] layer-flow의 Action 표시값을 `.ralph/progress.md` 의존 없이 `02_action.md` 미완 체크리스트에서 읽도록 전환한다.
- [x] Action 텍스트를 단일 문장으로 유지해 UI 카드에서 바로 실행 지시로 읽히게 정리한다.
- [x] Action 카드가 다중 미완 항목(상위 1~3개)을 우선순위대로 노출하도록 `flow.actionItems`(string[])를 layer-flow 응답에 추가한다(`flow.action`은 `actionItems[0]`과 동일, 백워드 호환 유지).
- [x] 다음 핸드오프 Action: 쇼케이스 UI(`Stage 2 카드`)가 `flow.actionItems`를 우선순위 리스트(1~3)로 렌더링하고, 항목별 핸드오프 책임자(core thread)를 라벨링하도록 표시안을 정리한다.
- [ ] 다음 핸드오프 Action: Stage 2 항목별 상태(대기/진행/완료)를 `flow.actionItems` 확장 필드로 받을 수 있도록 표시 스키마 초안을 정의한다.
