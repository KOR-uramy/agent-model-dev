# 02 Action

Need를 충족하기 위한 구체 행동을 정의한다.  
`flow.action`은 워크스페이스 `.ralph/progress.md` tail 한 줄과, 이 md의 **미완** 체크 요약을 합쳐 노출된다(병렬 에이전트는 progress를 건드리지 않을 수 있으므로 이 체크리스트가 Action의 근거가 된다).

## Checklist (작성자: 01 Need 단계)

- [ ] Need를 충족하기 위한 실행 가능한 Action 1~3개를 적는다.
- [ ] 각 Action이 어느 역할(기획/구현/검증)에서 처리될지 태깅한다.
- [ ] `planning → implementation → test` 사이클 중 이번 이터가 어느 칸인지 명시한다.
- [ ] progress를 갱신하는 경우 tail 한 줄이 위 Action과 동일한지, 병렬 모드면 이 md만으로도 다음 실행자가 이해 가능한지 검토한다.
