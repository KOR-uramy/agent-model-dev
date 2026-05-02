# 에이전트·모델 선택 근거 (이 저장소)

이 문서는 **추측이 아니라** 레포 안 스크립트·설정에서 확인한 사실만 요약한다. Cursor 제품 측 모델 라인업·가격은 [Cursor 공식 문서](https://cursor.com/docs)가 단일 근원이며, 여기서는 **Ralph 루프가 어떤 CLI·플래그로 모델을 고르는지**에 한정한다.

## 프로바이더

| 구분 | 선택 | 근거(코드·경로) |
|------|------|------------------|
| 로컬 Ralph 이터 | **Cursor Agent CLI** | `.cursor/ralph-scripts/ralph-common.sh`의 `ralph_cursor_agent_bin` — 실행 파일은 PATH상 `agent` 우선, 없으면 `cursor-agent` |
| 호출 형식 | `stream-json` | `ralph-common.sh`에서 `-p --force --output-format stream-json --model "<MODEL>"` 로 구성 |

앱 런타임(`apps/open-graze`)은 별도의 “벤더 고정 LLM”을 두지 않는다. 관측 대상은 주로 **CLI 에이전트 스트림**과 수집 API다.

## 모델 이름·기본값

| 항목 | 값 | 근거 |
|------|-----|------|
| 기본 모델 | `auto` | `.cursor/ralph-scripts/ralph-common.sh` — `DEFAULT_MODEL="auto"`, `MODEL="${RALPH_MODEL:-$DEFAULT_MODEL}"` |
| 덮어쓰기 | `RALPH_MODEL` 환경변수 또는 `ralph-loop.sh` / `ralph-once.sh`의 `-m` / `--model` | `ralph-loop.sh` 헬프·`ralph-common.sh` |
| 고정 모델 후보 나열 | 이 저장소에 하드코딩된 목록 없음 | 실제 사용 가능한 식별자는 `agent models`(또는 Cursor CLI 문서의 parameters)로 확인 |

`auto`는 Cursor가 구독·쿼터·작업 유형에 맞게 라우팅한다는 **의도**만 문서화한다. 특정 서브모델 ID는 Cursor 측 정책에 따라 변하므로 이 파일에 고정하지 않는다.

## 버전(에이전트 CLI)

| 항목 | 확인 방법 |
|------|-----------|
| CLI 빌드 | 터미널에서 `agent --version`(또는 `cursor-agent --version`) — `README.md`·`RALPH_TASK.md`와 동일 권장 |

저장소는 Cursor CLI 설치 경로를 강제하지 않으며, **버전 문자열은 커밋하지 않는다**(환경별).

## 제약(맥락·이터)

| 제약 | 기본값 | 근거 |
|------|--------|------|
| 맥락 경고(warn) 추정 토큰 상한 | 약 70k (추정치) | `.cursor/ralph-scripts/stream-parser.sh` — `WARN_THRESHOLD=70000` |
| 맥락 회전(rotate) 추정 토큰 상한 | 약 80k (추정치) | 동 파일 — `ROTATE_THRESHOLD=80000` |
| 루프 쪽 동일 이름 변수 | `WARN_THRESHOLD` / `ROTATE_THRESHOLD` (기본 70000 / 80000) | `ralph-common.sh` (소스 시 `stream-parser`가 파이프로만 쓰이면 파서 내부 상수가 실효) |
| 최대 이터 | `MAX_ITERATIONS` 기본 20, `0`/`--infinite`는 사실상 무제한 | `ralph-common.sh`, `ralph-loop.sh` |

토큰 수는 API의 정확한 usage가 아니라, 스트림 파서가 **바이트·문자 누적을 4로 나눈 추정**(`calc_tokens` in `stream-parser.sh`)이다. 운영 판단은 “정확한 과금 단위”가 아니라 **같은 세션 내 상대적 맥락 소모**용이다.

## 측정·관측

| 산출물 | 내용 | 근거 |
|--------|------|------|
| `.ralph/events.jsonl` | 이터·세션·추정 토큰·이벤트 종류 등 구조화 JSONL | `stream-parser.sh`의 `append_event` |
| `.ralph/activity.log` | 요약 로그 | `stream-parser.sh` |
| `.ralph/errors.log` | 실패·gutter 등 | `stream-parser.sh` / `errors.log` 설명 |
| OpenGraze 타임라인 | JSONL 동기화 후 SQLite `TimelineEvent` | `RALPH_TASK.md` Goal 절 |

## 요약

- **프로바이더**: Cursor Agent CLI.  
- **모델**: 기본 `auto`; 고정은 `RALPH_MODEL` / `-m`.  
- **버전**: 로컬 `agent --version`으로만 확정.  
- **제약**: 추정 토큰 ~70k 경고 / ~80k 회전 트리거(파서 상수).  
- **측정**: 스트림 파서 추정치 + JSONL·로그; 정확한 벤더 usage와 1:1이 아님을 전제로 한다.
