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

(Signs added from observed failures will appear below)
