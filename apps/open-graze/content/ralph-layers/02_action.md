# 02 Action

Need를 충족하기 위한 구체 행동을 정의한다.  
보통 최근 `.ralph/progress.md`의 최신 진행 메모 또는 현재 이터 목표에서 Action을 읽어온다.

## 실데이터 매핑 (Core 2/3)

- 시각화: `GET /api/ralph/layer-flow` 응답의 `flow.action`.
- 1차 근거: 워크스페이스 루트 `.ralph/progress.md`에서 헤더(`#`)/인용(`>`)이 아닌 **비어 있지 않은 줄** 중 마지막 줄(한 줄 요약으로 취급).
- 병렬·격리 워크트리: `progress.md`를 쓰지 않는 경우 API는 대체 안내 문구를 반환한다. 이때 Action은 **본 문서·에이전트 보고서(`.ralph/parallel/.../agent-*.md`)**에서 수동으로 이어 받는다.

## Checklist (작성자: 01 Need 단계)

- [ ] Need를 충족하기 위한 실행 가능한 Action 1~3개를 적는다.
- [ ] 각 Action이 어느 역할(기획·구현·검증)에서 처리될지 태깅한다.
- [ ] `flow.action`이 비어 있거나 진행 로그 대체 문구일 때, 병렬 보고서/체크리스트로 동일 Need에 대한 Action이 추적 가능한지 확인한다.
- [ ] 다음 Capability(03) 단계가 참고할 스크립트·모듈 경로가 Action 텍스트 또는 03 체크리스트에 노출되는지 확인한다.
