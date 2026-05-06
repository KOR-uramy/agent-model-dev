# 03 Capability + Business Logic

Action을 실제 수행하는 기능과 규칙 계층이다.  
예: 루프 스크립트의 역할 파이프(`planning`→`implementation`→`test`), 체크리스트 전부 완료 시 planning 자동 확장, **`.ralph/errors.log`에 유효한 최신 행이 있으면 일반 체크리스트보다 앞선 오류 복구**.

## 구현·근거 경로 (참고)

- 루프·역할: `.codex/ralph-scripts/ralph-loop.sh`, `ralph-common.sh` (기준), Cursor shim은 `.cursor/ralph-scripts/`가 동일 스크립트에 위임
- 레이어 설명 md: `apps/open-graze/content/ralph-layers/*.md` (본 파일 포함)
- API: `apps/open-graze/app/api/ralph/layer-flow/route.ts` — `flow.capabilityLogic`는 `ralph-common.sh`에서 역할 순환·자동 확장 정책을 요약해 노출

`GET /api/ralph/layer-flow`의 `flow.capabilityLogic`는 위 스크립트 존재·패턴을 읽은 한 줄 요약이다.

## Checklist (작성자: 02 Action 단계)

- [ ] Action을 지원하는 기능/모듈/스크립트 경로를 지정한다.
- [ ] 적용할 비즈니스 규칙(검증 조건, 제한, 실패 처리)을 명시한다.
- [ ] `RALPH_TASK.md`의 Loop Policy(3역할 사이클, `RALPH_AUTO_EXPAND_ON_COMPLETE`)와 `ralph-common.sh` 구현이 어긋나지 않는지 확인한다.
- [ ] 배포·런타임 정책과 충돌이 없는지 점검한다(포트 3000, snapshot `next start`, `RALPH_WORKSPACE_ROOT`로 워크스페이스 루트의 `.ralph/errors.log` 참조).
