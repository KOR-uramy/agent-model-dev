# Agent job5 — 수익화 문구 정합(동종 대비·갭 체크리스트)

## 한 일

- **UI·README·`apps/open-graze/.env.example`**를 기준으로 플랜·가격·결제 실패·청구·환불·무료 체험 관련 **표면 문구**를 대조했다.
- 병합 핫스팟(`README.md`, 루트 `.env.example` 등)은 지침에 따라 **수정하지 않고**, 갭은 **`docs/ux-friction-scenarios.md` §17**에 시나리오 표 행(S17-7 ~ S17-11)과 **`- [ ]` 완화 과제**로 추가했다.

## 근거 요약

| 표면 | 관찰 |
|------|------|
| `TossBillingClient` | 구독(단건)·비월간·`TOSS_SUBSCRIPTION_AMOUNT_KRW` 안내가 있음. |
| `apps/open-graze/README.md` | 토스 단건·승인·웹훅 절차와 환경 표가 UI와 대체로 일치. |
| `apps/open-graze/.env.example` | 금액 기본 100·웹훅 주석은 README보다 구체적; 부가세·세전/후는 미기재(기존 S17-2와 동일 축). |
| `/dashboard` | `구독 활성/비활성`만으로는 단건 모델이 드러나지 않음 → **S17-7** 및 신규 `- [ ]`. |
| `prepare` API | 503은 한글, 401/403/400은 영어 → **S17-8** 및 신규 `- [ ]`. |
| 루트 `README.md` | 결제는 앱 README 위임; 단건·금액 기본값 요약 없음 → **S17-9** 및 신규 `- [ ]`. |
| `public/llms.txt` | 결제 정책 한 줄 없음 → **S17-10** 및 신규 `- [ ]`. |
| `orderName` (prepare) | 위젯에 `… 구독`만 노출 가능 → **S17-11** 및 신규 `- [ ]`. |

## 변경 파일

- `docs/ux-friction-scenarios.md`
- `.ralph/parallel/1777813574-de7e4b8b/agent-job5.md` (본 파일)

## 테스트

- 본 작업은 **문서만** 변경. 자동 테스트 스크립트는 루트 `package.json`에 없음.
- 필요 시: `npm run lint -w open-graze` (결제 코드 미변경이나 회귀 확인용).

## 주의

- **`.ralph/progress.md`**, **`RALPH_TASK.md`** 는 수정하지 않음(병렬 지침).
- **`README.md`**, **루트 `.env.example`**, **`package.json`** 등은 병렬 병합 방지 목록상 **손대지 않음**; 갭은 UX 백로그(§17)에만 적재.
- **`.ralph/`는 `.gitignore`에 포함**될 수 있어, 본 보고서를 커밋하려면 `git add -f .ralph/parallel/1777813574-de7e4b8b/agent-job5.md` 가 필요할 수 있다.
- 현재 워크트리에서 `npm run lint -w open-graze`는 **`[slug]/page.tsx` 등 기존 JSX 파싱 오류**로 실패한다(이번 커밋과 무관).
