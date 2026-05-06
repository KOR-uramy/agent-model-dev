# Agent thread3 — Layer 08 (Release / Deploy / Debug)

## 변경 요약

- **릴리스 러너** (`scripts/release-open-graze.sh`): 포트·스냅샷·에러 루프 불변식을 주석으로 명시하고, `OPEN_GRAZE_RELEASE_PORT`(기본 `3000`) 단일 변수로 `kill-port` / `PORT` / `next start -p`를 통일했다. 스냅샷에 `next.config.ts` 복사를 추가해 레포 설정과 정렬했다.
- **런타임 에러 모니터** (`scripts/runtime-error-monitor.sh`): Next/App Router에서 자주 나오는 패턴(`[Error]`, `Error occurred`, `Internal Server Error`, 대소문자 혼합 `Failed to compile`)을 감지에 포함했다. `.ralph/errors.log`는 기존과 같이 **한 줄 덮어쓰기**이며, 태그는 환경변수 `RUNTIME_ERROR_SIGNAL_TAG`로 바꿀 수 있고 기본값은 `runtime-release`이다.
- **Layer 08 문서** (`apps/open-graze/content/ralph-layers/08_release_deploy_debug.md`): 운영 불변식 4가지와 실행용 Ops 체크리스트, 불변식 검증 명령을 추가했다.
- **테스트** (`scripts/test-release-ops-invariants.sh`): 위 계약을 정적 grep으로 검증한다(빌드/서버 기동 없음).

## 수정·추가한 파일

- `scripts/release-open-graze.sh`
- `scripts/runtime-error-monitor.sh`
- `scripts/test-release-ops-invariants.sh` (신규)
- `apps/open-graze/content/ralph-layers/08_release_deploy_debug.md`
- 본 리포트: `.ralph/parallel/1778081300-faa82589/agent-thread3.md`

## 테스트 실행

```sh
# 저장소 루트에서
sh scripts/test-release-ops-invariants.sh
```

통합 스모크(선택): `npm run release:open-graze` — 실제 `npm run build -w open-graze`와 서버 기동이 수행된다.

## 주의사항

- `package.json` 등 병합 충돌 다발 파일은 요구 범위에 없어 수정하지 않았다. 새 검증 스크립트는 `sh scripts/...`로 실행하면 된다.
- 포트만 바꿔야 하면 `OPEN_GRAZE_RELEASE_PORT=3100 sh scripts/release-open-graze.sh` 형태로 재정의 가능하다(기본 운영은 3000).
- `.ralph/errors.log`는 **최신 한 줄만** 유지하므로, 루프/대시보드는 “마지막 유효 줄” 기준으로 해석하는 것이 맞다.
