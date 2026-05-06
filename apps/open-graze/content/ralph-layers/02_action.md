# 02 Action

Need를 충족하기 위한 구체 행동을 정의한다.  
운영 루프에서는 워크스페이스 루트의 `.ralph/progress.md` **하단 비헤딩·비인용 줄**에서 최신 한 줄을 읽어 `flow.action`으로 노출한다. (`RALPH_ROLE_MODE=cycle`일 때 planning → implementation → test 경계는 같은 파일의 역할별 메모로 이어진다.)

## 근거 & 연동

| 소스 | 역할 |
|------|------|
| `.ralph/progress.md` | Action 텍스트의 기본 공급원(API) |
| `flow.coreSourcing.action` (API) | 진단용 경로 표기 |
| `01_need` 체크리스트 | 이 단계로 넘어오기 전 Need가 남긴 미완 `[ ]`가 트리거 |

## Checklist (작성자: 01 Need 단계)

- [ ] Need를 충족하기 위한 실행 가능한 Action 1~3개를 적는다.
- [ ] 각 Action이 어느 역할(기획/구현/검증)에서 처리될지 태깅한다.
- [ ] 각 Action이 `01_need`의 한 줄 Need로 역추적 가능한지 확인한다.
- [ ] `.ralph/progress.md`에 역할 태그·타임스탬프 등 다음 에이전트가 `flow.action` 한 줄만으로 맥락을 잡을 수 있게 남긴다.
- [ ] 병렬 작업 중 `progress.md`를 동시에 수정하지 않도록(머지 충돌) 오케스트레이터 규칙을 위반하지 않았는지 확인한다.
