# Agent job5 — 수익화 문구·동종 대비 갭 (parallel)

## 한 줄 요약

UI·README·`apps/open-graze/.env.example`를 대조해 **토스 단건 구독** 모델은 대체로 일치합니다. 동종 SaaS 대비 부족한 **플랜·청구·환불·체험·실패 후속** 영역은 아래 `- [ ]`로 정리했습니다. (병렬 규칙상 `RALPH_TASK.md`·루트 `README`·`.env.example`는 수정하지 않음.)

## 무엇을 바꿨는지

1. **결제 성공 후 UX** — `TossBillingSuccess`가 이미 `?billing=success`로 워크스페이스 대시보드에 돌아가므로, 해당 쿼리를 읽어 **성공 안내 배너**를 한 번 보여 주고 URL에서 쿼리를 제거합니다. 문구는 README의「구독(단건)·월 자동 과금 아님」과 맞춤.
2. **빌링 페이지 제목** — 대시보드 링크·README 표기와 동일하게 **「구독 · 결제 (토스)」** 로 통일(중점·공백).
3. **빌드 복구(동일 파일 내 누락/오타)** — 병렬 워크트리에서 `npm run build`가 깨져 있어, 과제 검증을 위해 최소 수정함:
   - `app/dashboard/page.tsx` 잘못된 `</div>` 제거
   - `app/dashboard/[slug]/page.tsx` 누락된 `copyHint`·클립보드 복사 함수·`publicOrigin` 상태
   - `app/login/page.tsx` `AuthCard`·`inputField` import 및 `registered` 쿼리 플래그

## 건드린 파일

| 파일 |
|------|
| `apps/open-graze/app/dashboard/page.tsx` |
| `apps/open-graze/app/dashboard/[slug]/page.tsx` |
| `apps/open-graze/app/dashboard/[slug]/billing/TossBillingClient.tsx` |
| `apps/open-graze/app/login/page.tsx` |
| `.ralph/parallel/1777814494-29aff6a6/agent-job5.md` (본 보고서) |

## 테스트 실행

```bash
cd /path/to/worktree
npm run build
```

결제 UI 스모크는 토스 키가 있을 때만: `npm run dev` 후 소유자 계정으로 `/dashboard/{slug}/billing`.

(선택) 루트 스모크: `README.md`에 적힌 `npm run platform:self-test` 등.

## Gotchas

- **`.ralph/`는 `.gitignore`**에 있어 보고서를 커밋하려면 `git add -f .ralph/parallel/1777814494-29aff6a6/agent-job5.md` 가 필요할 수 있음.
- **Stripe** `POST /api/billing/checkout`은 레거시 구독 Checkout이며, 제품 표준은 README상 **토스**; 운영 문서·UI에서 혼동 여지는 갭 목록에 둠.
- **`TOSS_SUBSCRIPTION_AMOUNT_KRW` 기본 100원**은 `.env.example` 주석·코드와 일치하나, `apps/open-graze/README.md` 토스 절 본문에는 숫자 기본값이 안 적혀 있음(선택 동기화 과제).

---

## 동종 대비·문서 정합 — 남은 갭 (`RALPH_TASK.md` 등에 옮겨 적기용)

오케스트레이터가 **성장·동종 비교 > 수익화** 줄이나 하위 항목으로 merge할 수 있게 `- [ ]`만 나열합니다.

- [ ] **플랜·가격표 UI** — 티어(무료/팀/엔터프라이즈 등)·포함 기능·가격을 한 화면에 비교(현재는 단일 `TOSS_SUBSCRIPTION_AMOUNT_KRW` 금액만 위젯에 표시).
- [ ] **README 토스 절 ↔ 기본 금액** — `TOSS_SUBSCRIPTION_AMOUNT_KRW` 미설정 시 **최소 100원**(코드·`.env.example` 주석)을 README 한 문장으로 명시해 문서·운영 질문을 줄임.
- [ ] **무료 체험·크레딧** — 제공하지 않을 경우에도 UI·README·가입 플로에 **「무료 체험 없음 / 워크스페이스 무료 사용 범위」** 를 동일 카피로 박아 두기(동종 대비 투명성).
- [ ] **청구·영수증·결제 이력** — 주문 ID·일시·금액·상태를 워크스페이스 소유자가 인앱에서 조회(또는 토스 영수증 링크 안내) — 현재는 DB·웹훅 중심, 사용자 대면 이력 UI 없음.
- [ ] **환불·취소 정책** — 고정 문구(영업일 기준, 디지털 상품 등)와 지원 채널을 README + 결제/설정 하단에 링크.
- [ ] **결제 실패 후속(dunning)** — `/billing/fail`은 토스 `message` 표시 수준; 카드 갱신·재시도 안내·이메일/알림은 미구현.
- [ ] **구독 상태와 제한** — `subscriptionStatus` 배지만 있고, 비활성 시 API·수집 제한 여부를 UI·README에 한 줄로 명시(있다면) 또는 “표시용만” 명시.
- [ ] **Stripe 레거시 경로** — `/api/billing/checkout` 사용 여부·폐기 일정을 README「Stripe 레거시」절에 운영자용으로 정리; UI에서 Stripe 진입이 없다면 “코드만 존재” 명시.
- [ ] **세금·현금영수증(국내 B2B)** — 법적 스코프 밖이면 README에 **비대상** 명시로 기대치 관리.
- [ ] **랜딩 `/` 타임라인** — 수익화·가격 CTA는 없음; 마케팅 축과 겹치나 “가격·플랜 링크” 한 줄은 수익화 정합에 포함 가능.

---

*작성: parallel agent job5. `RALPH_TASK.md`·`.ralph/progress.md`는 지시에 따라 미수정.*
