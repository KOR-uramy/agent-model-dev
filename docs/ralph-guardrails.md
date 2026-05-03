# Ralph Guardrails (Signs)

> Lessons learned from past failures. READ THESE BEFORE ACTING.

## Core Signs

### Sign: Read Before Writing
- **Trigger**: Before modifying any file
- **Instruction**: Read the existing file first

### Sign: No Secrets in Git
- **Trigger**: Before any commit
- **Instruction**: Never commit API keys; use local env or ignored config only

### Sign: Scope to This Repo + Linked App
- **Trigger**: When tempted to "fix everything"
- **Instruction**: Only change what the user asked for in `RALPH_TASK.md`

### Sign: Verify Builds on App Repo
- **Trigger**: After changing integration code in another clone
- **Instruction**: Run that repo's build/test commands and note result

---

## Learned Signs

### Sign: Prisma SQLite `DATABASE_URL` is schema-relative
- **Trigger**: `apps/open-graze`에서 `prisma/schema.prisma`가 `prisma/` 안에 있을 때
- **Instruction**: `DATABASE_URL`은 **스키마 파일이 있는 폴더** 기준이다. `file:./dev.db` → `prisma/dev.db`. `file:./prisma/dev.db`는 중첩 `prisma/prisma/dev.db`를 만들 수 있으므로 쓰지 않는다.

(Signs added from observed failures will appear below)
