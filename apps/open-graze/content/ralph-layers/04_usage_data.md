# 04 Usage Data

Capability 계층이 실행되며 남긴 사용 기록이다.  
예: timeline 이벤트, `.ralph/events.jsonl`/DB 적재 결과, 최근 kind/source/session 데이터.
다음 단계(05)의 트리거는 이 문서에서 미완으로 남긴 체크리스트다.

## Checklist (작성자: 03 Capability + Business Logic 단계)

- [x] 수집할 usage 이벤트 스키마(kind/source/session/ts)를 확정했다.
- [x] 로그/DB에서 확인할 조회 기준(최근 25건 적재, 최근 8건 표시, 기본 필터 없음)을 지정했다.
- [x] Presentation 계층 전달 표본을 최근 8건으로 고정하고 usageCount 기준을 동일하게 맞췄다.
