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

- [ ] 루트에서 `npm run build -w open-graze`가 통과하는지 확인한다(릴리스 스크립트가 동일 빌드를 호출한다).
- [ ] `npm run release:open-graze`(또는 `sh scripts/release-open-graze.sh`)로 기동할 때 콘솔에 `port 3000`(또는 설정한 `OPEN_GRAZE_RELEASE_PORT`)·`next start`·스냅샷 경로가 기대와 일치하는지 확인한다.
- [ ] 브라우저에서 `http://127.0.0.1:3000` 접속이 되는지 확인한다.
- [ ] 장애 시 `.ralph/errors.log`의 **마지막 줄**만 보고 복구 우선순위를 잡고, 수정 후 파일을 비우거나 재기동 후 다시 확인한다.
- [ ] 정적 계약 검증: `sh scripts/test-release-ops-invariants.sh`
