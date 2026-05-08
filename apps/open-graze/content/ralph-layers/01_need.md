# 01 Need

명시적 요구사항/목표를 정의한다.  
실행 기준은 `RALPH_TASK.md`의 미완 `[ ]` 항목이며, 현재 루프가 해결해야 할 핵심 Need를 한 줄로 표현한다.

## Checklist (전단계 입력 없음: 시작점)

- [x] `RALPH_TASK.md` Success Criteria 기준으로 Need/Action/Capability 데이터 경로를 레이어 문서 중심으로 통일한다.
- [x] Need 출처 우선순위를 `앱 입력 > 01_need.md 미완 항목 > RALPH_TASK.md 미완 항목`으로 확정한다.
- [x] `/api/ralph/layer-flow` 응답의 core(1~3) 요약이 빈 값 없이 항상 채워지는지 `flow.coreIntegrity`(`ok`/`issues`/`fields`)로 운영 검증을 노출한다.
- [ ] 다음 이터레이션 Need: `flow.coreIntegrity.ok === false` 인 핸드오프를 차단/경고하도록 SSE 스트림(`/api/ralph/layer-flow/stream`) 소비자(쇼케이스/모니터)에 반영한다.
