# agent-model-dev

에이전트 **모델·프롬프트·평가** 작업을 모아 두는 저장소입니다. [Ralph (ralph-wiggum-cursor)](https://github.com/agrimsingh/ralph-wiggum-cursor) 스크립트가 포함되어 있습니다.

## 요구 사항

- Git
- [Cursor CLI](https://cursor.com/install) — `cursor-agent` 사용 가능해야 함
- (선택) `brew install gum`

## 사용

1. `RALPH_TASK.md`에서 이번 스프린트 목표를 수정한다.
2. 프로젝트 루트에서:

```bash
./.cursor/ralph-scripts/ralph-setup.sh
```

비대화형 루프만 쓰려면 `ralph-loop.sh` / `ralph-once.sh`를 참고한다.

## Ralph 로그 / 워크스페이스 SDK

npm workspaces로 **`packages/ralph-workspace-sdk`**(연동 라이브러리)와 **`apps/ralph-log`**(Next 대시보드)가 있습니다. 다른 저장소에서 쓰는 방법은 SDK README를 본다.

```bash
npm install
npm run dev -w ralph-log
```

## 앱 코드와의 관계

MyAgent 등 앱 저장소와 **같은 머신에서 별도 디렉터리**로 두고, 필요할 때 경로를 명시해 작업한다. 이 레포는 앱 전체를 복제하지 않는 것을 권장한다.
