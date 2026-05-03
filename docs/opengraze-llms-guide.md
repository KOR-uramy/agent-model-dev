# OpenGraze 수집·연동 — LLM·앱 개발자용 가이드

이 문서는 **어떤 언어·런타임의 앱**이든 OpenGraze(Workspace Platform)로 **이벤트를 수집**하거나 **워크스페이스 Task API**를 쓰기 위해 필요한 정보만 압축해 둔다. 토스페이먼츠 [LLMs 연동 가이드](https://docs.tosspayments.com/guides/v2/get-started/llms-guide)와 같은 역할을 목표로 한다.

**머신용 한 줄 인덱스** — 배포된 앱 루트에서 `GET /llms.txt` (정적 파일)로 짧은 요약을 가져올 수 있다.

---

## 1. 무엇을 위해 쓰나

| 목적 | 엔드포인트 | 인증 |
|------|-------------|------|
| 이벤트 수집(관측) | `POST {BASE}/api/v1/events` | `Authorization: Bearer og_live_…` |
| 워크스페이스 작업 CRUD | `GET/POST/PATCH {BASE}/api/workspaces/{slug}/tasks…` | 브라우저와 동일 **로그인 세션**(쿠키) — 외부 스크립트는 세션 쿠키를 넘기거나 서버 프록시 권장 |

수집 키는 **대시보드 → 워크스페이스 → 수집용 API 키**에서 발급한다. 전체 문자열이 한 번만 표시되므로 **환경 변수**에만 보관한다.

---

## 2. 환경 변수(권장)

이 레포(monorepo)에서 선택 self-test를 돌릴 때는 저장소 **루트** `.env`(또는 셸 `export`)에 둔다. `npm run platform:self-test`가 읽는다.

| 변수 | 필수 | 설명 |
|------|------|------|
| `OPENGRAZE_PLATFORM_API_KEY` | 수집 시 **예** | 대시보드에서 발급한 전체 토큰 `og_live_…` |
| `OPENGRAZE_PLATFORM_URL` | 아니오 | 기본 `http://localhost:3000`. 프로덕션은 `https://당신의-도메인` |

**다른 저장소(별도 앱)**에서 OpenGraze만 호출할 때도 동일한 이름을 쓰면 LLM·문서·예제가 일치한다.

```bash
# 예: 셸 또는 해당 앱의 .env (커밋 금지)
export OPENGRAZE_PLATFORM_URL="https://opengraze.example.com"
export OPENGRAZE_PLATFORM_API_KEY="og_live_…………"
```

Task API를 서버 사이드에서 부를 계획이면 워크스페이스 slug를 별도 변수로 두는 것을 권장한다(문서·팀 규약용).

```bash
export OPENGRAZE_WORKSPACE_SLUG="open-graze-self"
```

---

## 3. 수집 API — 최소 계약

**요청**

- 메서드: `POST`
- URL: `{OPENGRAZE_PLATFORM_URL}/api/v1/events`
- 헤더:
  - `Authorization: Bearer <OPENGRAZE_PLATFORM_API_KEY>`
  - `Content-Type: application/json`
- 본문(JSON):
  - `kind` (string, 1~120자) — 이벤트 종류 식별자
  - `data` (object, 선택) — JSON 객체. 값은 직렬화 가능한 형태 권장

**성공**: HTTP `200`, 본문 예 `{ "ok": true }`

**자주 나오는 오류**

| HTTP | 의미 |
|------|------|
| 401 | `Authorization` 없음, `Bearer` 형식 아님, 토큰 무효·삭제됨 |
| 400 | JSON/Zod 검증 실패(`kind` 누락 등) |
| 413 | 본문 크기 초과(앱 상한은 기본 256KiB 근처, `INGEST_MAX_BODY_BYTES`로 조정 가능) |
| 429 | 키별 레이트 제한. 본문 `retryAfterSeconds`·헤더 `Retry-After`·`X-RateLimit-*`를 따른다 |

**한도 스냅샷(비인증)** — 배포 인스턴스가 적용 중인 기본 수치를 JSON으로 보려면 `GET {BASE}/api/v1/meta/limits` 를 호출한다(비밀·워크스페이스 데이터 없음).

**429 재시도(권장)** — 응답 헤더 `Retry-After`(초)를 읽을 수 있으면 그 시간만큼 대기한 뒤 한 번 재시도한다. 없으면 JSON의 `retryAfterSeconds`를 사용한다. 연속 실패에는 지수 백오프(예: 1s → 2s → 4s …)에 상한(예: 60s)을 둔다.

**검증 절차(로컬)**

1. OpenGraze `npm run dev` (포트 **3000** 규약).
2. 로그인 → 워크스페이스 → 수집용 API 키 생성 → 전체 키를 `OPENGRAZE_PLATFORM_API_KEY`에 설정.
3. 아래 `curl` 또는 앱 코드에서 `POST /api/v1/events`로 실제 이벤트를 한 번 보낸다.
4. 대시보드 **최근 수집 활동**에 방금 보낸 `kind`가 보이면 정식 연동 성공이다.
5. `npm run platform:self-test`는 같은 자격증명 경로를 빠르게 확인하는 선택 스모크다.

---

## 4. 복붙 예제

### curl

```bash
curl -sS -X POST "${OPENGRAZE_PLATFORM_URL:-http://localhost:3000}/api/v1/events" \
  -H "Authorization: Bearer ${OPENGRAZE_PLATFORM_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"kind":"my_app.metric","data":{"count":1}}'
```

### Node (fetch, ESM)

```javascript
const base = process.env.OPENGRAZE_PLATFORM_URL ?? "http://localhost:3000";
const token = process.env.OPENGRAZE_PLATFORM_API_KEY;
if (!token) throw new Error("OPENGRAZE_PLATFORM_API_KEY");

const res = await fetch(`${base.replace(/\/$/, "")}/api/v1/events`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ kind: "my_app.metric", data: { count: 1 } }),
});
if (!res.ok) throw new Error(await res.text());
```

### Python (urllib)

```python
import json, os, urllib.request

base = os.environ.get("OPENGRAZE_PLATFORM_URL", "http://localhost:3000").rstrip("/")
token = os.environ["OPENGRAZE_PLATFORM_API_KEY"]
req = urllib.request.Request(
    f"{base}/api/v1/events",
    data=json.dumps({"kind": "my_app.metric", "data": {"count": 1}}).encode(),
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    method="POST",
)
urllib.request.urlopen(req).read()
```

---

## 5. 워크스페이스 Task API (요약)

대시보드 UI는 **조회 전용**이다. 생성·상태 변경은 REST로 한다. 상세는 **`apps/open-graze/README.md`** 의 “워크스페이스 작업 API” 절을 따른다.

- `GET /api/workspaces/{slug}/tasks`
- `POST /api/workspaces/{slug}/tasks` — `{"title":"…","description?":"…","status?":"todo"}`
- `PATCH /api/workspaces/{slug}/tasks/{taskId}` — `{"status":"in_progress"}` 등

외부 백엔드에서 호출할 때는 **세션 쿠키** 또는 향후 도입되는 서비스 토큰 정책을 맞춘다(현재 구현은 NextAuth 세션 기준).

---

## 6. 보안 규범

- `og_live_…` 를 저장소·이슈·채팅에 넣지 않는다. **CI**에서는 시크릿 변수로만 주입한다.
- 키 유출 시 대시보드에서 **삭제 후 재발급**한다.
- 프로덕션은 HTTPS만 사용한다.

---

## 7. 더 읽을 곳

- 앱 전체 설정·마이그레이션: `apps/open-graze/README.md`
- 루트에서 dogfood: 루트 `README.md` 의 “자기 연동 테스트”
- 요구사항·제품 정의: `RALPH_TASK.md`
