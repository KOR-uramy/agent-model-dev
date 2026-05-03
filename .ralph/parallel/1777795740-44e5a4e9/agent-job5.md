# Agent job5 — 수익화 문구·동종 정합

## 변경 요약

- **결제 UI** (`TossBillingClient`): `apps/open-graze/README.md`의 **구독(단건)** 표현과 맞추어, 월 자동 과금이 아닌 단건 승인 후 `subscriptionStatus` 활성화임을 본문에 명시. `prepare` 응답의 **청구 금액(KRW)**을 화면에 표시해 가격이 README·`TOSS_SUBSCRIPTION_AMOUNT_KRW` 주석과 같은 출처이라는 점을 사용자에게 드러냄.
- **결제 실패** (`billing/fail`): 동종 대비에서 자주 넣는 **워크스페이스(대시보드) 복귀** 링크를 `다시 시도` 옆에 추가.
- **워크스페이스 목록** (`dashboard/page.tsx`): `active` / `inactive` 원문 대신 **구독 활성·구독 비활성** 라벨로 표기해 청구/구독 문맥과 정합.

병렬 작업 규칙에 따라 **루트 `README.md`**, **루트 `.env.example`**, **`RALPH_TASK.md`**, **`.ralph/progress.md`**는 수정하지 않았다. 갭은 아래 체크리스트로만 적었다(오케스트레이터가 `RALPH_TASK.md`에 옮길 수 있음).

## 동종 SaaS 대비 갭 (`- [ ]` — 수익화 축)

- [ ] **요금제(플랜)**: 현재 단일 금액·단건 결제만 존재. 티어·기능 비교표·업그레이드/다운그레이드 문구가 없다.
- [ ] **가격 공개 페이지**: 로그인 후 결제 화면뿐이며, 랜딩/마케팅용 가격표·부가세 포함 여부 고지가 없다.
- [ ] **청구·영수증**: 결제·웹훅은 DB에 남지만, 사용자가 볼 **청구 내역·영수증 다운로드** UI가 없다.
- [ ] **환불·취소 정책**: 토스/상거래 기준 **환불 가능 조건·기간·문의 채널** 문구가 UI·README 어디에도 없다.
- [ ] **무료 체험**: trial 기간·카드 수집 전후 정책이 제품에 없고, 그에 맞는 **카피·배너**도 없다.
- [ ] **결제 실패 후속**: 실패 페이지는 토스 `message` 표시 수준. **카드 한도·네트워크** 등 구분 안내, 고객센터/재시도 가이드(동종 수준)는 미흡하다.
- [ ] **Stripe 레거시**: API·웹훅은 있으나 UI 진입이 없다. README만 변수를 적는다면, **“레거시 전용·UI 없음”**을 한 줄로 맞출지 결정이 필요하다.
- [ ] **루트 vs 앱 환경 변수**: 루트 `.env.example`는 수집 연동만 있고 결제 키는 **`apps/open-graze/.env.example`**에만 있다. 의도된 분리면 루트 README 한 줄로 **결제 설정 위치**를 교차 안내할지 검토.
- [ ] **구독 상태 세분화**: 스키마는 문자열 하나(`active`/`inactive`). 만료·미결제·취소 예정 등 **동종 구독 라이프사이클**과 맞추려면 모델·카피 확장이 필요하다.

## 수정·참고 파일

| 파일 |
|------|
| `apps/open-graze/app/dashboard/[slug]/billing/TossBillingClient.tsx` |
| `apps/open-graze/app/dashboard/[slug]/billing/fail/page.tsx` |
| `apps/open-graze/app/dashboard/page.tsx` |
| `.ralph/parallel/1777795740-44e5a4e9/agent-job5.md` |

## 테스트 실행

```bash
cd /Users/uram/dev/agent-model-dev/.ralph-worktrees/1777795740-44e5a4e9-job5
npm run build -w open-graze
```

이 워크트리에서는 **`@/lib/workspace-task-status` 모듈 not found**로 빌드가 실패했다. 본 작업 diff와 무관한 기존 상태로 보이며, 해당 모듈 복구 후 다시 빌드하면 된다.

## Gotchas

- 병렬 규칙상 **merge hotspot** 파일(`README.md`, 루트 `.env.example`, lockfile 등)은 손대지 않았다. 문서·env 정합은 오케스트레이터/후속 작업으로 옮기는 것이 안전하다.
- 결제 금액 문구는 **서버 `prepare` 응답**과 동기화되므로, 향후 클라이언트만 바꿔 “가격”을 속이는 일은 없다.
