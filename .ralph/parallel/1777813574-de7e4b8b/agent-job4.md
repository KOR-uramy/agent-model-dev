# Agent 4 (job4) — 디자인·토큰 정리

## 변경 요약

- **CSS 시맨틱 토큰**: `globals.css`에 `--surface-subtle`, `--danger`, `--danger-muted`를 추가하고 `@theme inline`에 노출해 보조 면·위험색을 한곳에서 조정할 수 있게 했습니다.
- **공유 UI 문자열**: `apps/open-graze/lib/ui-tokens.ts`에 섹션 eyebrow, 본문 muted, 링크, 입력 필드, 인라인 코드 클래스를 모아 로그인·가입·대시보드에서 중복 문자열을 제거했습니다.
- **버그·중복 제거**: 랜딩 `page.tsx`의 잘못된 `</span>` 태그 수정, 헤더 내비에서 중복된「로그인」제거, `dashboard/page.tsx`의 깨진 JSX(`AppMain` 미일치) 수정, `dashboard/[slug]/page.tsx`의 이중「수집용 API 키」블록·잘못된 리스트 JSX·불필요한 `</div>` 제거 후 단일 섹션으로 통합했습니다.
- **시각 계층**: 로그인을 `AppChrome` + `AuthCard`로 맞추고 `zinc-*`를 `text-muted` / `codeInline` 등 토큰 기반 클래스로 정리했습니다. 워크스페이스 목록 제목에 `font-display`를 적용했습니다.
- **체크리스트 문서**: 후속 디자인 작업을 `docs/design-system-checklist.md`에 `- [ ]` 항목으로 정리했습니다.

## 수정한 파일

- `apps/open-graze/app/globals.css`
- `apps/open-graze/lib/ui-tokens.ts` (신규)
- `apps/open-graze/app/page.tsx`
- `apps/open-graze/app/login/page.tsx`
- `apps/open-graze/app/register/page.tsx`
- `apps/open-graze/app/dashboard/page.tsx`
- `apps/open-graze/app/dashboard/[slug]/page.tsx`
- `docs/design-system-checklist.md` (신규)

## 테스트 실행

저장소 루트에서:

```bash
npm run build -w open-graze
```

(선택) 전체 워크스페이스 빌드:

```bash
npm run build
```

## 주의사항

- `dashboard/[slug]/page.tsx`에 있던 클립보드 복사 헬퍼는 JSX에 연결되지 않아 미사용이었고, 린트 경고 해소를 위해 제거했습니다. 복사 UI가 필요하면 새 이슈에서 버튼과 함께 다시 연결하면 됩니다.
- `bg-surface-subtle`은 `globals.css`의 `@theme`에 등록되어 있어야 합니다. 빌드에서 유틸이 생성되지 않으면 `border-[var(--list-border)]` + `bg-card` 조합으로 대체할 수 있습니다.
- `.ralph/`는 기본 `.gitignore`에 포함될 수 있어, 병렬 에이전트 리포트를 커밋할 때는 `git add -f .ralph/parallel/.../agent-job4.md`가 필요할 수 있습니다.
