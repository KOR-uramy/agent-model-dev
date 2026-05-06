# 01 Need

명시적 요구사항/목표를 정의한다.  
실행 기준은 워크스페이스 루트의 `RALPH_TASK.md`에 남아 있는 **가장 먼저 등장하는 미완** `- [ ]` 항목이며, 앱의 `GET /api/ralph/layer-flow` 응답 필드 `flow.need`가 동일 규칙으로 채워진다.

## 근거 & 연동

| 소스 | 역할 |
|------|------|
| `RALPH_TASK.md` | 단일 근거; Need는 여기 첫 `[ ]`에서 파생 |
| `flow.coreSourcing.need` (API) | 런타임에 어떤 파일을 읽었는지 표기 |
| 레이어 트리거 | Need(1)만 예외 — **루프·과제 입력 자체**가 트리거 (`RALPH_TASK.md` 정책) |

## Checklist (전단계 입력 없음: 시작점)

- [ ] 현재 루프의 최우선 Need를 한 줄로 명시한다.
- [ ] Need가 측정 가능한 성공 조건과 연결되는지 확인한다.
- [ ] `RALPH_TASK.md` Success Criteria 중 이번 Need가 직접 겨냥하는 `- [ ]` 행을 인용하거나 줄 번호를 적어 추적 가능하게 한다.
- [ ] `GET /api/ralph/layer-flow` 의 `flow.need` 문자열이 워크스페이스 루트 기준으로 위 첫 미완 항목과 같은지 확인한다(스냅샷 배포 시 `RALPH_WORKSPACE_ROOT` 포함).
- [ ] 병렬 에이전트가 `RALPH_TASK.md`를 수정하지 않는 경우, 오케스트레이터가 남긴 Need만 따라가고 로컬 가정을 문서에 남기지 않았는지 점검한다.
