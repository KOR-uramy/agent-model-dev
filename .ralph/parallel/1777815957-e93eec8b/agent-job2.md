# Agent job2 — UI 역할 필터와 `/api/ralph/events` 연동

## 무엇을 바꿨는지

- **`GET /api/ralph/events?role=`** — `planning` \| `design` \| `implementation` \| `test`만 인정(그 외·빈 값은 필터 없음). `tail`과 함께 사용합니다.
- **DB 조회** — 역할 필터가 켜지면 동일 `tail` 한도 안에서 매칭 행을 더 모으기 위해 최대 `min(5000, max(tail, tail*40))`행까지 읽은 뒤 `detail.role`이 일치하는 이벤트만 남기고, 초과 시 최신 `tail`건만 잘라 반환합니다.
- **`/` 홈** — 타임라인 카드 헤더에 **역할 필터** `<select>` 추가. 선택 시 API와 동일한 `role` 쿼리로 다시 불러오며, 주기적 폴링(4초)에도 동일 필터가 유지됩니다.
- **빈 결과** — 타임라인이 비어 있지 않은데 역할만 맞는 행이 없으면 `error` 없이 `hint`로 안내하고, 테이블 하단 메시지에 그 문구를 표시합니다.
- **SDK** — `eventDetailRole`, `parseRoleQueryParam`, `AGENT_ROLE_KEYS`를 추가해 API·UI·DB 경로가 같은 규약을 공유합니다.

## 건드린 파일

- `packages/ralph-workspace-sdk/src/types.ts`
- `packages/ralph-workspace-sdk/src/snapshot.ts`
- `packages/ralph-workspace-sdk/src/index.ts`
- `apps/open-graze/lib/timeline-feed.ts`
- `apps/open-graze/app/api/ralph/events/route.ts`
- `apps/open-graze/app/page.tsx`
- `.ralph/parallel/1777815957-e93eec8b/agent-job2.md` (본 문서)

## 테스트

- 별도 테스트 러너(vitest 등)는 워크스페이스에 없어 **자동 단위 테스트는 추가하지 않았습니다**.
- 검증: `npm run build -w ralph-workspace-sdk` 후, 워크스페이스 루트에서 `npm run build`(또는 `npm run build -w open-graze`). SDK `dist`가 갱신된 뒤에야 `parseRoleQueryParam` 등 타입이 앱에 보입니다.

## 주의사항 (gotchas)

- 역할 필터는 **`WorkspaceFeedEvent.detail.role`**이 API 규약과 같은 경우만 통과합니다. 역할 메타가 없는 행은 필터 시 제외됩니다.
- 희소한 역할은 DB에서 더 많이 읽어도 `tail`보다 적게 나올 수 있습니다.
- 이 워크트리에는 **다른 파일의 중복 선언 등으로 `next build`가 실패할 수 있는 상태**가 있었습니다. 본 작업과 무관한 오류일 때는 해당 파일을 먼저 정리한 뒤 빌드하세요.
