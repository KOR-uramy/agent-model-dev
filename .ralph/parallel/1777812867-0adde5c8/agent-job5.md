# Agent job5 — 수익화(UI·README·`.env.example`) 동종 대비 갭

## 한 줄 요약

플랜·가격·결제 실패·청구·환불·무료 체험 문구가 **UI**, **루트/README·앱 README**, **루트·앱 `.env.example` 주석** 사이에서 어떻게 다른지 검토했고, 병합 핫스팟 정책에 따라 README·`.env.example`은 **수정하지 않고**, 갭은 **`docs/ux-friction-scenarios.md` §17**에 시나리오 표와 `- [ ]` 완화 과제로 추가했다.

## 일치하는 점(검토 메모)

- **토스 v2 단건 구독 활성화** 모델은 `TossBillingClient`, `prepare`의 `orderName`, `apps/open-graze/README.md`의 「구독(단건)」, `apps/open-graze/.env.example`의 토스 블록 주석과 정합한다.
- 워크스페이스 상세 **구독 · 결제** 링크 표기는 앱 README 절차 문구와 같다.
- 금액은 `getTossSubscriptionAmountKrw()` → `prepare` JSON → UI **이번 결제 금액**으로 한 출처다.

## 변경 사항

| 파일 | 내용 |
|------|------|
| `docs/ux-friction-scenarios.md` | 상단 색인에 **§17 수익화·가격·문서 표면 간 정합** 행 추가. **§17** 본문: S17-1~6 시나리오 표 + 완화 과제 `- [ ]` 7개(루트 `.env.example` 교차 안내, 세금 표기, confirm 영어 에러, `billing=success`/`cancel` 배너, 단일 상품·비체험 명시, 환불·영수증). |

## 터치한 파일

- `docs/ux-friction-scenarios.md`
- `.ralph/parallel/1777812867-0adde5c8/agent-job5.md`(본 파일)

## 테스트 실행

이번 diff는 마크다운만이다. 앱 회귀가 필요하면 예시:

```bash
npm run lint -w open-graze
npm run build -w open-graze
```

(워크스트리에 따라 기존 린트/빌드 이슈가 있을 수 있음.)

## 주의(Gotchas)

- 병렬 지침에 따라 **`README.md`**, **`apps/open-graze/README.md`**, **`.env.example`**, **`apps/open-graze/.env.example`**, **`RALPH_TASK.md`**, **`.ralph/progress.md`**는 수정하지 않았다. 루트 `.env.example`에 결제 변수가 없는 점 등은 §17의 `- [ ]`로만 추적한다.
- §5·§3에 이미 있는 결제 카피·로딩 과제와 **겹치면** 구현 시 한 과제로 합치면 된다.
