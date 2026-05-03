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

npm workspaces로 **`packages/ralph-workspace-sdk`**(연동 라이브러리)와 **`apps/open-graze`**(패키지名 `open-graze`)가 있습니다. 이 앱이 **OpenGraze**이자 **Workspace Platform**(워크스페이스 플랫폼)이며, 과거 문맥의 **workspace-platform**과 **별개 앱이 아니라 동일**하다. Ralph 대시보드 + 워크스페이스·수집 API·Auth가 한 Next 앱에 있다. 다른 저장소에서 쓰는 방법은 SDK README를 본다.

```bash
npm install
npm run dev
```

**포트 규범** — OpenGraze는 **3000만** 쓴다. `npm run dev` / `npm run dev:open-graze`는 시작 전에 `3000` 리스너를 종료한 뒤 서버를 띄운다(`scripts/dev-open-graze.sh`). 수동으로 비울 때는 `npm run kill:3000`. 테스트할 때마다 임의 포트(`-p 3020` 등)를 늘리지 않는다.

워크스페이스만 직접 띄울 때도 같은 순서: `npm run kill:3000 && npm run dev -w open-graze`.

개발 서버를 띄운 뒤 API가 200인지 한 번 확인하는 것을 권장한다(빌드 통과만으로는 번들러 조합 버그를 놓칠 수 있음). 타임라인은 SQLite라 **처음엔 비어 있을 수 있다** — `npm run sync:feed` 후 다시 확인한다.

```bash
curl -sS -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/ralph/events?tail=5"
```

동일 앱(OpenGraze = Workspace Platform) 안에 이메일·비밀번호 로그인, 워크스페이스, API 키, Stripe 레거시·토스 결제 규범이 들어 있다. 설정은 **`apps/open-graze/README.md`** — 결제 표준은 **[토스페이먼츠 v2 LLMs 가이드](https://docs.tosspayments.com/guides/v2/get-started/llms-guide)**. 결제 키 없이 **로그인 → 워크스페이스 → 키 → ingest**만 재현하려면 같은 파일의 **핵심 플로 (결제 미설정)** 절을 따른다.

**OpenGraze 수집 연동(LLM·타 앱)** — 환경 변수 이름과 HTTP 계약은 **`docs/opengraze-llms-guide.md`** 에 모아 두었다. 배포된 OpenGraze 기준 짧은 인덱스는 **`/llms.txt`**(앱 `public/llms.txt`).

### 자기 연동 테스트(dogfood)

이 레포를 **수집 API의 첫 클라이언트**처럼 등록해 검증한다.

1. `apps/open-graze/.env`에 DB·`AUTH_*`를 넣고 `npm run db:migrate -w open-graze` 후 `npm run dev`(포트 3000만 사용).
2. 브라우저에서 로그인 → 워크스페이스 생성(이름 예: `OpenGraze self`, slug 예: `open-graze-self`) → **API 키** 발급 후 전체 `og_live_...` 문자열을 복사한다.
3. 루트 `.env`에 `OPENGRAZE_PLATFORM_API_KEY=og_live_...` (및 필요 시 `OPENGRAZE_PLATFORM_URL`)을 넣는다. `.env`가 없으면 셸에 `export`로 같은 변수를 설정해도 된다.
4. `npm run platform:self-test` — 루트에 `.env`가 있으면 스크립트 실행 전에 자동으로 읽는다. 성공 시 대시보드 해당 워크스페이스 **이벤트**에 `opengraze.self_test`가 보인다.

## 앱 코드와의 관계

MyAgent 등 앱 저장소와 **같은 머신에서 별도 디렉터리**로 두고, 필요할 때 경로를 명시해 작업한다. 이 레포는 앱 전체를 복제하지 않는 것을 권장한다.
