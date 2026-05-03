# Agent job6 — 트래픽·운영 (수집 API·대시보드)

## 변경 요약

- **대시보드 세션 `GET /api/workspaces/[slug]/events`**: 사용자 ID + 워크스페이스 ID 단위 인메모리 고정 윈도 레이트. 환경 변수 `DASHBOARD_EVENTS_GET_RATE_LIMIT_PER_WINDOW`(기본 90), `DASHBOARD_EVENTS_GET_RATE_LIMIT_WINDOW_MS`(기본 60000), `0`이면 비활성. 429 시 `ingest`와 동형 JSON(`code: rate_limited`, `retryAfterSeconds`)·`Retry-After`·`X-RateLimit-*`, 서버 로그 `dashboard_events_list_rate_limited`.
- **공개 한도 API**: 비인증 `GET /api/v1/meta/limits` — 수집 본문 상한·레이트·대시보드 목록 레이트 스냅샷(JSON, 비밀 없음).
- **워크스페이스 상세 UI**: 운영·남용 방어 블록, 수집 POST **HTTP 코드 플레이북 표**(401/400/413/429), `meta/limits` 링크, 목록 429 시 `retryAfterSeconds` 기반 안내 문구, 키 발급 후 **복사 버튼** 복구.
- **문서**: `docs/traffic-operations-peer-checklist.md`에 동종 참고(OTel·상태 페이지)·구현 스냅샷·`[ ]`/`[x]` 백로그 정리. `docs/opengraze-llms-guide.md`에 429 행·`meta/limits`·재시도 가이드. `public/llms.txt`에 한 줄 추가.
- **품질**: 워크트리에 있던 JSX 구문 오류(`app/page.tsx` `Link` 닫는 태그, `app/login/page.tsx` 누락 `</div>`, `app/dashboard/page.tsx` `AppChrome`/`AppMain` 누락) 수정. `eslint.config.mjs`에서 `prisma/seed.cjs` 제외(CJS `require`).

## 수정·추가한 파일

- `apps/open-graze/lib/dashboard-events-rate-limit.ts` (신규)
- `apps/open-graze/app/api/workspaces/[slug]/events/route.ts`
- `apps/open-graze/app/api/v1/meta/limits/route.ts` (신규)
- `apps/open-graze/app/dashboard/[slug]/page.tsx`
- `apps/open-graze/app/dashboard/page.tsx`
- `apps/open-graze/app/login/page.tsx`
- `apps/open-graze/app/page.tsx`
- `apps/open-graze/eslint.config.mjs`
- `apps/open-graze/public/llms.txt`
- `docs/traffic-operations-peer-checklist.md`
- `docs/opengraze-llms-guide.md`
- `.ralph/parallel/1777813574-de7e4b8b/agent-job6.md` (본 파일)

## 테스트 실행

```bash
cd /Users/uram/dev/agent-model-dev/.ralph-worktrees/1777813574-de7e4b8b-job6
npm run lint -w open-graze
npm run build -w open-graze
```

로컬에서 한도 JSON 확인: 브라우저 또는 `curl -sS http://localhost:3000/api/v1/meta/limits | jq .`

## 주의사항

- 레이트 리밋은 **프로세스(인스턴스) 단위** 인메모리이며, 수평 확장 시 합산 한도가 아님 — 체크리스트에 분산 과제 `[ ]`로 남김.
- `.env.example`은 병합 핫스팟 정책상 수정하지 않음. 새 변수는 `docs/traffic-operations-peer-checklist.md`·대시보드 카피·본 리포트에만 기술.
- `RALPH_TASK.md`·`.ralph/progress.md`는 수정하지 않음(병렬 규칙).
