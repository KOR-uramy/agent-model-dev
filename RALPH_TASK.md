# Ralph Task: 에이전트 모델 개발

## Goal

에이전트에 쓸 **모델·프롬프트·평가 기준**을 정리하고, 재현 가능한 형태(코드·문서·스크립트)로 남긴다. 범위는 이 저장소와 연동되는 앱 저장소(예: `llm_agent`)에서 **명시적으로 요청된** 변경만 포함한다.

## Context

- 이 레포는 **모델/실험/문서** 중심; 프로덕션 앱 전체는 별도 저장소에 둔다.
- 반복 작업은 `./.cursor/ralph-scripts/ralph-setup.sh` 또는 `ralph-loop.sh` + `cursor-agent`로 수행한다.

## Success Criteria (Definition of Done)

- [ ] `RALPH_TASK.md`의 목표가 현재 스프린트와 일치하며, 완료된 항목은 `[x]`로 표시되어 있다.
- [ ] 모델/버전/프로바이더 선택 근거가 `docs/` 또는 루트 마크다운 한 파일에 요약되어 있다(추측이 아닌 측정·제약 기반).
- [ ] 변경이 앱 코드를 건드리면 해당 저장소에서 `go build` / `npm run build` 등 **해당 프로젝트의 빌드**가 통과한다는 기록이 `RALPH_TASK.md` 또는 커밋 메시지에 남아 있다.
- [ ] 비밀(API 키)은 저장소에 커밋하지 않는다.

## Out of Scope (unless explicitly requested)

- 앱 저장소의 대규모 리팩터링, 인프라 신규 구축.
- `install.sh` 파이프 설치(비TTY에서 멈출 수 있음) — 스크립트는 `.cursor/ralph-scripts/`에 고정한다.

## Notes for the Agent

- `cursor-agent` 설치: https://cursor.com/install
- 선택 UI: `brew install gum`
- 병렬 모드 사용 시 `RALPH_TASK.md`는 반드시 커밋된 상태여야 한다(upstream Ralph 제약).
