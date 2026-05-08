# 08 Release / Deploy / Debug

최종 단계에서 실제 빌드·배포와 운영 에러 디버깅을 담당한다.  
배포 성공 여부와 장애 복구 결과를 다시 Need로 환류시켜 다음 루프를 시작한다.

## 운영 불변식 (OpenGraze 로컬 릴리스)

아래는 `scripts/release-open-graze.sh` + `scripts/runtime-error-monitor.sh`가 보장하는 계약이다.

1. **포트 3000** — 기본 LISTEN 포트는 `OPEN_GRAZE_RELEASE_PORT`(미설정 시 `3000`) 한 곳에서만 정의한다. 기동 전 `scripts/kill-port.sh`로 해당 포트를 비운다.
2. **`next start` 전용** — 릴리스 러너는 빌드 산출물(`.next`)만 서빙한다. `next dev`는 이 경로에서 사용하지 않는다.
3. **불변 스냅샷** — `.release/open-graze/<타임스탬프>/`에 `.next`·`public`·`content`·설정 파일을 복사한 뒤, 그 디렉터리를 cwd로 두고 기동한다. `current` 심볼릭 링크가 최신 스냅샷을 가리킨다. 소스 트리(`apps/open-graze`)를 직접 수정해도 이미 떠 있는 프로세스에는 반영되지 않는다(재배포 필요).
4. **최신 에러 신호 루프** — 서버 로그는 `runtime-error-monitor.sh`로 통과시키고, 매칭되는 에러 한 줄만 워크스페이스 루트의 `.ralph/errors.log`에 **덮어쓴다**(누적 금지). 태그는 기본 `[runtime-release]`이며, Ralph/API는 이 파일의 **마지막 유효 줄**을 “최신 장애”로 읽을 수 있다.

## Checklist (작성자: 07 UI 단계)

- [ ] 실제 빌드(`npm run build`)를 통과시키고 결과를 기록한다.
- [ ] 배포 절차(스테이징/프로덕션) 실행 결과와 롤백 포인트를 기록한다.
- [ ] 에러 발생 시 재현·원인·수정·재검증을 완료하고 guardrail/sign을 남긴다.

## Ops 체크리스트 (Layer 08 실행)

아래 순서대로 실행하면 포트·`next start`·스냅샷·에러 신호 루프가 한 번에 검증된다.

### 실행 순서 요약 (단일 파이프라인)

| 단계 | 명령 / 산출물 | 불변식 |
|------|----------------|--------|
| 1 | `npm run build -w open-graze` | 프로덕션 `.next` 생성 |
| 2 | `.release/open-graze/<STAMP>/`에 복사 + `current` 갱신 | cwd = 불변 스냅샷 |
| 3 | `kill-port.sh` → `PORT` / `OPEN_GRAZE_RELEASE_PORT` 정렬 | 기본 **3000** |
| 4 | `next start -p "$PORT"` (표준출력·표준에러 파이프) | **`next dev` 금지** |
| 5 | `runtime-error-monitor.sh` | `.ralph/errors.log` **한 줄 덮어쓰기** |

### 최소 검증 (약 30초, 터미널만)

워크스페이스 루트에서 그대로 붙여 넣기:

```sh
sh scripts/test-release-ops-invariants.sh && \
  echo "LISTEN default:" && grep -F 'OPEN_GRAZE_RELEASE_PORT="${OPEN_GRAZE_RELEASE_PORT:-3000}"' scripts/release-open-graze.sh && \
  echo "errors.log (마지막 줄 = 최신 장애 신호):" && tail -n 1 .ralph/errors.log 2>/dev/null || echo "(파일 없음 또는 비어 있음 — 정상일 수 있음)"
```

- 첫 줄이 `OK: release ops invariants`로 끝나면 **포트 기본값·`next start`·스냅샷·에러 덮어쓰기 계약**은 스크립트 수준에서 유지된 것이다.
- `tail` 결과는 릴리스를 한 번도 안 띄웠거나 에러가 없으면 비어 있을 수 있다(누적 로그가 아니라 **한 줄 덮어쓰기**이므로).

### 런타임 체크리스트 (기동 직후 10초)

아래 명령은 "지금 떠 있는 프로세스"가 불변식을 실제로 만족하는지 확인한다.

```sh
sh scripts/check-open-graze-release-runtime.sh
```

- 확인 항목: `3000`(또는 설정 포트) LISTEN, `next start` 명령, 프로세스 cwd=`.release/open-graze/current` 실체, `.ralph/errors.log` 최신 신호 가시성.
- 실패 시: 메시지의 항목(포트 점유/프로세스 종류/current 링크/cwd 불일치/에러 신호 파일)을 순서대로 정리 후 `npm run release:open-graze`로 재배포한다.

### 운영자 즉시 실행 체크리스트 (복붙용)

릴리스 직후 아래 3개 명령으로 "기동 상태 + 최신 장애 신호 + 스냅샷 경로"를 바로 확인한다.

```sh
sh scripts/open-graze-ops-checklist.sh
```

동일 내용을 개별 명령으로 실행하려면:

```sh
sh scripts/check-open-graze-release-runtime.sh
tail -n 1 .ralph/errors.log 2>/dev/null || echo "(latest error signal 없음)"
readlink .release/open-graze/current
```

- 첫 줄이 `OK: release runtime checklist complete ...`면 포트/`next start`/cwd 스냅샷 정렬은 통과다.
- 두 번째 줄은 최신 장애 신호 1줄만 보여준다(빈 출력이면 아직 매칭 에러 없음).
- 세 번째 줄은 현재 활성 스냅샷 타임스탬프 디렉터리를 보여준다.

1. **정적 계약 (CI/로컬 공통)**  
   - 루트에서: `sh scripts/test-release-ops-invariants.sh`  
   - 기대: `OK: release ops invariants (...)` 한 줄로 종료(exit 0).

2. **프로덕션 빌드**  
   - `npm run build -w open-graze`  
   - 릴리스 스크립트가 동일 명령을 호출하므로, 여기서 실패하면 릴리스도 실패한다.

3. **로컬 릴리스 기동**  
   - `npm run release:open-graze` 또는 `sh scripts/release-open-graze.sh`  
   - 기본 포트는 **3000** (`OPEN_GRAZE_RELEASE_PORT`로만 오버라이드).  
   - 콘솔에 `Layer 08 context` 블록이 출력되면 다음을 눈으로 확인한다.  
     - `LISTEN_PORT`가 3000(또는 설정값)인지  
     - `SNAPSHOT_DIR`·`CURRENT_SYMLINK`가 `.release/open-graze/<타임스탬프>`를 가리키는지  
     - `SERVER_CMD=next start`, `NODE_ENV=production`인지  
     - `ERROR_SIGNAL` 경로가 워크스페이스 루트 `.ralph/errors.log`인지  

4. **동작 확인**  
   - 브라우저: `http://127.0.0.1:3000` (포트를 바꿨다면 그 번호로 접속).  

5. **장애 시**  
   - API/에이전트는 `.ralph/errors.log`의 **마지막 한 줄**만 “최신 장애”로 본다(덮어쓰기, 누적 없음).  
   - 태그는 기본 `[runtime-release]`; 테스트·다른 파이프는 `RUNTIME_ERROR_SIGNAL_TAG`로 구분 가능.  
   - 소스 수정만으로는 이미 떠 있는 프로세스에 반영되지 않는다 → 스크립트를 다시 실행해 새 스냅샷을 띄운다.

## 장애 디버그 빠른 절차 (운영자용)

아래는 **포트·스냅샷·로그 신호**를 의심할 때 그대로 따라 할 수 있는 순서다.

1. **정적 계약 재확인** — `sh scripts/test-release-ops-invariants.sh` (exit 0이면 스크립트 계약은 유지됨).
2. **최신 신호 한 줄** — 워크스페이스 루트에서 `tail -n 1 .ralph/errors.log` (비어 있으면 릴리스 프로세스가 아직 에러 패턴을 내지 않았거나, 파이프가 끊긴 상태일 수 있음).
3. **실제 LISTEN 포트** — 기본 `3000`. 바꿨다면 `OPEN_GRAZE_RELEASE_PORT`와 브라우저 URL을 동일하게 맞출 것. `sh scripts/kill-port.sh <포트>`로 좀비 LISTEN 정리 후 재기동.
4. **스냅샷 일치** — `.release/open-graze/current`가 가리키는 디렉터리가 콘솔 `Layer 08 context`의 `SNAPSHOT_DIR`과 같은지 확인. 다르면 오래된 프로세스가 떠 있을 수 있음.
5. **재배포** — 소스/환경 수정 후에는 반드시 `npm run release:open-graze`(또는 `sh scripts/release-open-graze.sh`)로 **새 타임스탬프 스냅샷**을 만들고 다시 띄운다(`next dev`로 대체하지 않는다).

디버그 시 워크스페이스 루트는 환경 변수 `RALPH_WORKSPACE_ROOT`로 노출되므로, 스냅샷 cwd와 혼동하지 말 것.

### 운영 시 주의 (gotchas)

- **에러 신호는 패턴 일치 시에만 갱신된다.** `runtime-error-monitor.sh`의 ERE에 걸리지 않는 로그 줄은 `.ralph/errors.log`를 바꾸지 않는다. 새 형태의 스택 트레이스가 보이면 스크립트의 `_ERROR_PATTERN`을 보강한 뒤 `test-release-ops-invariants.sh`로 회귀 검증한다.
- **프로세스가 살아 있는데 `errors.log`가 오래됐다면**, 실제로는 에러가 없거나 파이프가 끊긴 경우일 수 있다. `Layer 08 context`에 찍힌 `SNAPSHOT_DIR`과 `current` 심볼릭 링크를 먼저 맞춘다.
- **LISTEN 확인 (선택):** macOS/Linux에서 `lsof -nP -iTCP:3000 -sTCP:LISTEN`으로 포트 점유를 확인할 수 있다(기본 포트를 바꿨다면 해당 번호로 조회).

**요약 표**

| 항목 | 기대 |
|------|------|
| LISTEN | `OPEN_GRAZE_RELEASE_PORT` 미설정 시 **3000**; 기동 시 `PORT`와 `next start -p` 동일 |
| 서버 | `next start`만 (`next dev` 금지) |
| cwd | `.release/open-graze/<stamp>/` (불변 복사본) |
| 최신 에러 | `$REPO_ROOT/.ralph/errors.log` 단일 줄 덮어쓰기 |
