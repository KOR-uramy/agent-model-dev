# Agent job5 — 수익화 문구 정합(동종 대비·갭)

## 검토 범위

- **UI**: `apps/open-graze/app/dashboard/[slug]/billing/*`, 워크스페이스 상세의 **구독 · 결제** 링크, 대시보드 목록의 `subscriptionStatus` 라벨
- **문서**: `apps/open-graze/README.md`(병합 핫스팟 정책상 **읽기만**), 루트 `README.md`(동일), `apps/open-graze/.env.example` 주석(동일)
- **동종 SaaS 관행**: 공개 플랜/가격표, 결제 실패·재시도 카피, 청구서·환불 정책·무료 체험 문구 등은 보통 랜딩 또는 청구 UI·법무 페이지에 분리되어 있다.

## 일치하는 점(요약)

- 결제 표준은 **토스페이먼츠 v2**이고 Stripe는 레거시로 문서·코드 주석이 같다.
- `apps/open-graze/README.md`의 **구독(단건)**·워크스페이스 **소유자**·`/dashboard/{slug}/billing` 경로는 UI(`TossBillingClient`, **구독 · 결제** 링크)와 맞다.
- 금액 출처는 서버 `prepare` → UI 표시 → `TOSS_SUBSCRIPTION_AMOUNT_KRW` / `getTossSubscriptionAmountKrw()`로 한 줄로 이어진다.
- `NEXT_PUBLIC_APP_URL` 또는 `Host` 유도는 `billing/page.tsx`의 `baseUrl`과 README 설명이 맞다.

## 코드 변경

- `TossBillingClient.tsx`: 단건 결제임을 README와 같이 유지하면서, **「청구」**가 정기 청구를 연상할 수 있어 **「이번 결제 금액」**으로 바꿔 단건 결제 카피와 정합을 높였다.

## 갭(후속 작업 후보, `- [ ]`)

동종 대비 시 흔히 갖추나 본 제품·문서·(정책상 수정 불가였던) README·`.env.example`에는 비어 있거나 한쪽에만 있는 항목이다.

- [ ] **플랜(티어)** — 현재는 워크스페이스당 **단일 금액·단건 활성화** 수준이다. 플랜명·기능 비교·업/다운그레이드 문구가 UI·README 어디에도 없다. 의도가 단일 상품이면 랜딩·README에 **「단일 상품」** 한 줄로 박아 두는 편이 동종 대비에서 모호함을 줄인다.
- [ ] **가격 공개** — 금액은 결제 화면·`prepare` 응답에만 드러난다. README 표에는 `TOSS_SUBSCRIPTION_AMOUNT_KRW` **기본 100원**이 없고(`.env.example` 주석에만 있음), **부가세 포함 여부**도 어디에도 없다.
- [ ] **결제 실패** — `billing/fail`은 토스 쿼리 `message`/`code`와 **다시 시도 / 워크스페이스로**만 있다. README에는 실패 URL·사용자 안내가 없고, `docs/ux-friction-scenarios.md`에 적힌 것처럼 **한 줄 안내 + CTA**를 동종 수준으로 맞출지 정한다.
- [ ] **청구·영수증** — 정기 청구·인보이스·영수증 발급 흐름은 없다. 단건이라도 **영수증/내역**을 줄지 정책을 정한 뒤 UI·README에 맞춘다.
- [ ] **환불·취소** — 조건·기간·문의 채널이 UI·README에 없다. 토스/상거래 기준 문구를 한 곳(앱 내 페이지 또는 외부 정책 URL)으로 정한다.
- [ ] **무료 체험** — trial 기간·카드 수집 전후 정책이 없다. **`inactive` = 무료로 쓸 수 있는 범위**인지 명시하지 않으면 사용자 기대와 어긋날 수 있다.
- [ ] **루트 README vs 앱 README** — 루트는 결제 세부를 `apps/open-graze/README.md`로 넘긴다. **구독(단건)·웹훅·기본 금액**까지 루트에서 한 줄 요약할지(병합 정책과 상충 시 앱 README만 단일 근원으로 유지할지) 정한다.

## 터치한 파일

- `apps/open-graze/app/dashboard/[slug]/billing/TossBillingClient.tsx`
- `.ralph/parallel/1777807515-47bfdae0/agent-job5.md`(본 파일)

## 테스트·검증

- 자동 테스트 스크립트는 루트에 없다. 정적 검증:

```bash
npm run lint -w open-graze
npm run build -w open-graze
```

- 변경 파일만 빠르게 보려면: `cd apps/open-graze && npx eslint "app/dashboard/[slug]/billing/TossBillingClient.tsx"`(통과 확인함).
- `npm run lint -w open-graze`는 기존에 `prisma/seed.cjs`의 `@typescript-eslint/no-require-imports` 때문에 실패할 수 있다.
- 이 워크트리에서 `npm run build -w open-graze`는 `@/lib/workspace-task-status` 미해결로 실패했다(본 작업과 무관).

## 주의(고착)

- 병렬 에이전트 지침에 따라 **`README.md`**, **`apps/open-graze/README.md`**, **`.env.example`**, **`apps/open-graze/.env.example`**는 이번 작업에서 **수정하지 않았다**. 문서·env와의 갭은 위 `- [ ]`와 본문에만 남겼다.
- **`RALPH_TASK.md`**, **`.ralph/progress.md`**는 수정하지 않았다.
