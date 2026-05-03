#!/bin/bash
# Ralph Wiggum: Common utilities and loop logic
#
# Shared functions for ralph-loop.sh and ralph-setup.sh
# All state lives in .ralph/ within the project.

# =============================================================================
# SOURCE DEPENDENCIES
# =============================================================================

# Get the directory where this script lives
_RALPH_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source the task parser for YAML backend support
if [[ -f "$_RALPH_SCRIPT_DIR/task-parser.sh" ]]; then
  source "$_RALPH_SCRIPT_DIR/task-parser.sh"
  _TASK_PARSER_AVAILABLE=1
else
  _TASK_PARSER_AVAILABLE=0
fi

# =============================================================================
# CONFIGURATION (can be overridden before sourcing)
# =============================================================================

# Token thresholds
WARN_THRESHOLD="${WARN_THRESHOLD:-70000}"
ROTATE_THRESHOLD="${ROTATE_THRESHOLD:-80000}"

# Iteration limits
MAX_ITERATIONS="${MAX_ITERATIONS:-20}"

# Model selection
# Codex CLI는 Cursor의 `auto` 라우팅 값을 이해하지 않으므로 Codex 계열 기본값을 둔다.
DEFAULT_MODEL="${RALPH_CODEX_DEFAULT_MODEL:-gpt-5.2}"
MODEL="${RALPH_MODEL:-$DEFAULT_MODEL}"

# Feature flags (set by caller)
USE_BRANCH="${USE_BRANCH:-}"
OPEN_PR="${OPEN_PR:-false}"
SKIP_CONFIRM="${SKIP_CONFIRM:-false}"

# =============================================================================
# SOURCE RETRY UTILITIES
# =============================================================================

# Source retry logic utilities
SCRIPT_DIR="${SCRIPT_DIR:-$(dirname "${BASH_SOURCE[0]}")}"
if [[ -f "$SCRIPT_DIR/ralph-retry.sh" ]]; then
  source "$SCRIPT_DIR/ralph-retry.sh"
fi

# =============================================================================
# BASIC HELPERS
# =============================================================================

# Cross-platform sed -i
sedi() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

# Get the .ralph directory for a workspace
get_ralph_dir() {
  local workspace="${1:-.}"
  echo "$workspace/.ralph"
}

# Find the nearest ancestor that contains RALPH_TASK.md.
ralph_find_task_root() {
  local start="${1:-.}"
  local dir
  dir="$(cd "$start" && pwd)"

  while [[ -n "$dir" && "$dir" != "/" ]]; do
    if [[ -f "$dir/RALPH_TASK.md" ]]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done

  if [[ -f "/RALPH_TASK.md" ]]; then
    echo "/"
    return 0
  fi

  return 1
}

# Codex CLI executable.
ralph_codex_bin() {
  if command -v codex &> /dev/null; then
    echo "codex"
  else
    echo ""
  fi
}

# Backward-compatible alias used by copied parallel helpers.
ralph_cursor_agent_bin() {
  ralph_codex_bin
}

ralph_codex_home() {
  local workspace="${1:-.}"
  if [[ -n "${RALPH_CODEX_HOME:-}" ]]; then
    echo "$RALPH_CODEX_HOME"
  fi
}

# Get current iteration from .ralph/.iteration
get_iteration() {
  local workspace="${1:-.}"
  local state_file="$workspace/.ralph/.iteration"
  
  if [[ -f "$state_file" ]]; then
    cat "$state_file"
  else
    echo "0"
  fi
}

# Set iteration number
set_iteration() {
  local workspace="${1:-.}"
  local iteration="$2"
  local ralph_dir="$workspace/.ralph"
  
  mkdir -p "$ralph_dir"
  echo "$iteration" > "$ralph_dir/.iteration"
}

# Increment iteration and return new value
increment_iteration() {
  local workspace="${1:-.}"
  local current=$(get_iteration "$workspace")
  local next=$((current + 1))
  set_iteration "$workspace" "$next"
  echo "$next"
}

# Get context health emoji based on token count
get_health_emoji() {
  local tokens="$1"
  local pct=$((tokens * 100 / ROTATE_THRESHOLD))
  
  if [[ $pct -lt 60 ]]; then
    echo "🟢"
  elif [[ $pct -lt 80 ]]; then
    echo "🟡"
  else
    echo "🔴"
  fi
}

# =============================================================================
# LOGGING
# =============================================================================

# Log a message to activity.log
log_activity() {
  local workspace="${1:-.}"
  local message="$2"
  local ralph_dir="$workspace/.ralph"
  local timestamp=$(date '+%H:%M:%S')
  
  mkdir -p "$ralph_dir"
  echo "[$timestamp] $message" >> "$ralph_dir/activity.log"
}

# Log an error to errors.log
log_error() {
  local workspace="${1:-.}"
  local message="$2"
  local ralph_dir="$workspace/.ralph"
  local timestamp=$(date '+%H:%M:%S')
  
  mkdir -p "$ralph_dir"
  echo "[$timestamp] $message" >> "$ralph_dir/errors.log"
}

# Log to progress.md (called by the loop, not the agent)
log_progress() {
  local workspace="$1"
  local message="$2"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local progress_file="$workspace/.ralph/progress.md"
  
  echo "" >> "$progress_file"
  echo "### $timestamp" >> "$progress_file"
  echo "$message" >> "$progress_file"
}

# =============================================================================
# INITIALIZATION
# =============================================================================

# Initialize .ralph directory with default files
init_ralph_dir() {
  local workspace="$1"
  local ralph_dir="$workspace/.ralph"
  
  mkdir -p "$ralph_dir"
  
  # Initialize progress.md if it doesn't exist
  if [[ ! -f "$ralph_dir/progress.md" ]]; then
    cat > "$ralph_dir/progress.md" << 'EOF'
# Progress Log

> Updated by the agent after significant work.

---

## Session History

EOF
  fi
  
  # Initialize guardrails.md if it doesn't exist
  if [[ ! -f "$ralph_dir/guardrails.md" ]]; then
    cat > "$ralph_dir/guardrails.md" << 'EOF'
# Ralph Guardrails (Signs)

> Lessons learned from past failures. READ THESE BEFORE ACTING.

## Core Signs

### Sign: Read Before Writing
- **Trigger**: Before modifying any file
- **Instruction**: Always read the existing file first
- **Added after**: Core principle

### Sign: Test After Changes
- **Trigger**: After any code change
- **Instruction**: Run tests to verify nothing broke
- **Added after**: Core principle

### Sign: Commit Checkpoints
- **Trigger**: Before risky changes
- **Instruction**: Commit current working state first
- **Added after**: Core principle

---

## Learned Signs

EOF
  fi
  
  # Initialize errors.log if it doesn't exist
  if [[ ! -f "$ralph_dir/errors.log" ]]; then
    cat > "$ralph_dir/errors.log" << 'EOF'
# Error Log

> Failures detected by stream-parser. Use to update guardrails.

EOF
  fi
  
  # Initialize activity.log if it doesn't exist
  if [[ ! -f "$ralph_dir/activity.log" ]]; then
    cat > "$ralph_dir/activity.log" << 'EOF'
# Activity Log

> Real-time tool call logging from stream-parser.

EOF
  fi
}

# =============================================================================
# TASK MANAGEMENT
# =============================================================================

# Check if task is complete
# Uses task-parser.sh when available for cached/YAML support
check_task_complete() {
  local workspace="$1"
  local task_file="$workspace/RALPH_TASK.md"
  
  if [[ ! -f "$task_file" ]]; then
    echo "NO_TASK_FILE"
    return
  fi
  
  # Use task parser if available (provides caching)
  if [[ "${_TASK_PARSER_AVAILABLE:-0}" -eq 1 ]]; then
    local remaining
    remaining=$(count_remaining "$workspace" 2>/dev/null) || remaining=-1
    
    if [[ "$remaining" -eq 0 ]]; then
      echo "COMPLETE"
    elif [[ "$remaining" -gt 0 ]]; then
      echo "INCOMPLETE:$remaining"
    else
      # Fallback to direct grep if parser fails
      _check_task_complete_direct "$workspace"
    fi
  else
    _check_task_complete_direct "$workspace"
  fi
}

# Direct task completion check (fallback)
_check_task_complete_direct() {
  local workspace="$1"
  local task_file="$workspace/RALPH_TASK.md"
  
  # Only count actual checkbox list items, not [ ] in prose/examples
  # Matches: "- [ ]", "* [ ]", "1. [ ]", etc.
  local unchecked
  unchecked=$(grep -cE '^[[:space:]]*([-*]|[0-9]+\.)[[:space:]]+\[ \]' "$task_file" 2>/dev/null) || unchecked=0
  
  if [[ "$unchecked" -eq 0 ]]; then
    echo "COMPLETE"
  else
    echo "INCOMPLETE:$unchecked"
  fi
}

# Count task criteria (returns done:total)
# Uses task-parser.sh when available for cached/YAML support
count_criteria() {
  local workspace="${1:-.}"
  local task_file="$workspace/RALPH_TASK.md"
  
  if [[ ! -f "$task_file" ]]; then
    echo "0:0"
    return
  fi
  
  # Use task parser if available (provides caching)
  if [[ "${_TASK_PARSER_AVAILABLE:-0}" -eq 1 ]]; then
    local progress
    progress=$(get_progress "$workspace" 2>/dev/null) || progress=""
    
    if [[ -n "$progress" ]] && [[ "$progress" =~ ^[0-9]+:[0-9]+$ ]]; then
      echo "$progress"
    else
      # Fallback to direct grep if parser fails
      _count_criteria_direct "$workspace"
    fi
  else
    _count_criteria_direct "$workspace"
  fi
}

# Direct criteria counting (fallback)
_count_criteria_direct() {
  local workspace="${1:-.}"
  local task_file="$workspace/RALPH_TASK.md"
  
  # Only count actual checkbox list items, not [x] or [ ] in prose/examples
  # Matches: "- [ ]", "* [x]", "1. [ ]", etc.
  local total done_count
  total=$(grep -cE '^[[:space:]]*([-*]|[0-9]+\.)[[:space:]]+\[(x| )\]' "$task_file" 2>/dev/null) || total=0
  done_count=$(grep -cE '^[[:space:]]*([-*]|[0-9]+\.)[[:space:]]+\[x\]' "$task_file" 2>/dev/null) || done_count=0
  
  echo "$done_count:$total"
}

# =============================================================================
# TASK PARSER CONVENIENCE WRAPPERS
# =============================================================================

# Get the next task to work on (wrapper for task-parser.sh)
# Returns: task_id|status|description or empty
get_next_task_info() {
  local workspace="${1:-.}"
  
  if [[ "${_TASK_PARSER_AVAILABLE:-0}" -eq 1 ]]; then
    get_next_task "$workspace"
  else
    echo ""
  fi
}

# Mark a specific task complete by line-based ID
# Usage: complete_task "$workspace" "line_15"
complete_task() {
  local workspace="${1:-.}"
  local task_id="$2"
  
  if [[ "${_TASK_PARSER_AVAILABLE:-0}" -eq 1 ]]; then
    mark_task_complete "$workspace" "$task_id"
  else
    echo "ERROR: Task parser not available" >&2
    return 1
  fi
}

# List all tasks with their status
# Usage: list_all_tasks "$workspace"
list_all_tasks() {
  local workspace="${1:-.}"
  
  if [[ "${_TASK_PARSER_AVAILABLE:-0}" -eq 1 ]]; then
    get_all_tasks "$workspace"
  else
    echo "ERROR: Task parser not available" >&2
    return 1
  fi
}

# Refresh task cache (useful after external edits)
refresh_task_cache() {
  local workspace="${1:-.}"
  
  if [[ "${_TASK_PARSER_AVAILABLE:-0}" -eq 1 ]]; then
    # Invalidate and re-parse
    rm -f "$workspace/.ralph/$TASK_MTIME_FILE" 2>/dev/null
    parse_tasks "$workspace"
  fi
}

# Best-effort: push current branch to origin (never fails the caller). Skip if RALPH_SKIP_POST_PUSH=1.
# Args: workspace (repo root)
ralph_try_push_workspace() {
  local ws="${1:-.}"
  if [[ "${RALPH_SKIP_POST_PUSH:-0}" == "1" ]]; then
    return 0
  fi
  if ! git -C "$ws" rev-parse --git-dir >/dev/null 2>&1; then
    return 0
  fi
  if ! git -C "$ws" remote get-url origin >/dev/null 2>&1; then
    echo "ℹ️  origin 원격 없음 — git push 생략" >&2
    return 0
  fi
  local cur rc
  cur="$(git -C "$ws" symbolic-ref -q --short HEAD 2>/dev/null || true)"
  if [[ -z "$cur" ]]; then
    echo "ℹ️  detached HEAD — git push 생략" >&2
    return 0
  fi
  rc=0
  if git -C "$ws" rev-parse --verify "${cur}@{upstream}" >/dev/null 2>&1; then
    git -C "$ws" push 2>&1 || rc=$?
  else
    git -C "$ws" push -u origin "$cur" 2>&1 || rc=$?
  fi
  if [[ "$rc" -eq 0 ]]; then
    echo "📤 $cur → origin push 완료" >&2
  else
    echo "⚠️  git push 실패(rc=$rc). 인증·브랜치 보호·network 확인." >&2
  fi
  return 0
}

# =============================================================================
# ROLE PIPELINE (기획 → 디자인 → 구현 → 테스트, 순환)
# =============================================================================
# RALPH_ROLE_MODE=cycle (기본): iteration마다 역할이 바뀌고, 직전 역할 산출물을 감시한다.
# RALPH_ROLE_MODE=mono: 역할 구분 없이 기존 단일 프롬프트만 사용.

# 1-based iteration → role key
ralph_role_for_iteration() {
  local i="${1:-1}"
  local r=$(( (i - 1) % 4 ))
  case $r in
    0) echo "planning" ;;
    1) echo "design" ;;
    2) echo "implementation" ;;
    3) echo "test" ;;
  esac
}

ralph_role_label_ko() {
  case "$1" in
    planning) echo "기획" ;;
    design) echo "디자인" ;;
    implementation) echo "구현" ;;
    test) echo "테스트" ;;
    *) echo "$1" ;;
  esac
}

# 직전 iteration의 역할 (감시 대상). iteration 1이면 빈 문자열.
ralph_prior_role_for_iteration() {
  local i="${1:-1}"
  if [[ "$i" -le 1 ]]; then
    echo ""
    return
  fi
  ralph_role_for_iteration "$((i - 1))"
}

ralph_prior_role_label_ko() {
  local k="$1"
  [[ -z "$k" ]] && echo "" && return
  ralph_role_label_ko "$k"
}

# =============================================================================
# PROMPT BUILDING
# =============================================================================

# Shared instructions (after role header / supervision)
# Args: iteration, progress_role_key (optional; for progress.md convention in cycle mode)
_build_prompt_shared_body() {
  local iteration="$1"
  local progress_role="${2:-}"
  local progress_rule
  if [[ -n "$progress_role" ]]; then
    progress_rule="4. Update \`.ralph/progress.md\` — start the entry with a line: \`**역할: (한글 라벨) ($progress_role)\**\` then summary, supervision notes, and next handoff."
  else
    progress_rule="4. Update \`.ralph/progress.md\` with what you accomplished and what's next for the following iteration."
  fi
  cat << EOF
## FIRST: Read State Files

Before doing anything:
1. Read \`RALPH_TASK.md\` - your task and completion criteria
2. Read \`docs/ralph-guardrails.md\` - lessons from past failures (FOLLOW THESE)
3. Read \`.ralph/progress.md\` - what's been accomplished
4. Read \`.ralph/errors.log\` - recent failures to avoid

## Working Directory (Critical)

You are already in a git repository. Work HERE, not in a subdirectory:

- Do NOT run \`git init\` - the repo already exists
- Do NOT run scaffolding commands that create nested directories (\`npx create-*\`, \`pnpm init\`, etc.)
- If you need to scaffold, use flags like \`--no-git\` or scaffold into the current directory (\`.\`)
- All code should live at the repo root or in subdirectories you create manually

## Git Protocol (Critical)

Ralph's strength is state-in-git, not LLM memory. Commit early and often:

1. After completing each criterion, commit your changes:
   \`git add -A && git commit -m 'ralph: implement state tracker'\`
   \`git add -A && git commit -m 'ralph: fix async race condition'\`
   \`git add -A && git commit -m 'ralph: add CLI adapter with commander'\`
   Always describe what you actually did - never use placeholders like '<description>'
2. After any significant code change (even partial): commit with descriptive message
3. Before any risky refactor: commit current state as checkpoint
4. **Push is mandatory when \`origin\` exists**: after each commit (or tight batch), run \`git push\` (or \`git push -u origin <branch>\` if no upstream yet). Do **not** end the iteration with commits that exist only locally — the next agent or host must see them on the remote.

If you get rotated, the next agent picks up from your last commit **on the remote if you pushed**. Your commits ARE your memory only after \`git push\`.

## Task Execution

1. Work on the next unchecked criterion in RALPH_TASK.md (look for \`[ ]\`) **that fits your current role** (see Role Boundaries above). If none fit, document blockers in \`.ralph/progress.md\` and output handoff notes for the next role.
2. Run tests after changes when your role is **test** or when you touch executable code (**implementation**).
3. **Mark completed criteria**: Edit RALPH_TASK.md and change \`[ ]\` to \`[x]\` only when your role owns verification (**test** role for code-facing criteria, or when the criterion is purely planning/docs and **planning** agrees).
$progress_rule
5. When every list checkbox in \`RALPH_TASK.md\` is \`[x]\`: follow the doc’s **성장 루프** / **동종 비교 → 체크 확장** / **성장·동종 비교** — name 1–3 comparison SaaS in \`.ralph/progress.md\`, gap-scan UI·UX·design·monetization·traffic·marketing, add new measurable \`[ ]\` items before treating the sprint as done. Output \`<ralph>COMPLETE</ralph>\` only when you stop and there are **no** remaining \`[ ]\` checkboxes (after any required expansion pass).
6. If stuck 3+ times on same issue: output \`<ralph>GUTTER</ralph>\`

## Learning from Failures

When something fails:
1. Check \`.ralph/errors.log\` for failure history
2. Figure out the root cause
3. Add a Sign to \`docs/ralph-guardrails.md\` using this format:

\`\`\`
### Sign: [Descriptive Name]
- **Trigger**: When this situation occurs
- **Instruction**: What to do instead
- **Added after**: Iteration $iteration - what happened
\`\`\`

## Context Rotation Warning

You may receive a warning that context is running low. When you see it:
1. Finish your current file edit
2. Commit and push your changes
3. Update .ralph/progress.md with what you accomplished and what's next
4. You will be rotated to a fresh agent that continues your work

Begin by reading the state files.
EOF
}

# Build the Ralph prompt for an iteration
# Args: workspace, iteration, role_key (optional; empty = mono)
build_prompt() {
  local workspace="$1"
  local iteration="$2"
  local role_key="${3:-}"

  if [[ -z "$role_key" ]]; then
    cat << EOF
# Ralph Iteration $iteration

You are an autonomous development agent using the Ralph methodology.

EOF
    _build_prompt_shared_body "$iteration" ""
    return
  fi

  local role_ko prior_key prior_ko phase_idx cycle_num
  role_ko=$(ralph_role_label_ko "$role_key")
  prior_key=$(ralph_prior_role_for_iteration "$iteration")
  prior_ko=$(ralph_prior_role_label_ko "$prior_key")
  phase_idx=$(( (iteration - 1) % 4 + 1 ))
  cycle_num=$(( (iteration - 1) / 4 + 1 ))

  cat << EOF
# Ralph Iteration $iteration — 역할: **$role_ko** (\`$role_key\`) · 사이클 $cycle_num · 단계 $phase_idx/4

You are one stage in a **four-role pipeline**: 기획(planning) → 디자인(design) → 구현(implementation) → 테스트(test), then repeat. The next agent run will be the next role; you must make handoff easy.

EOF

  case "$role_key" in
    planning)
      cat << EOF
## Role Boundaries — 기획 (planning)

- Anchor every proposal in \`RALPH_TASK.md\` **Goal (본질)** and **Success** north-star items — multi-agent role monitoring, observability, trust, reproducibility, workspace platform checks. **Reject or defer** feature churn, trends, or “completeness” that do not clearly serve that essence; if something might still matter, write **one line linking it to the essence** before suggesting new \`[ ]\` items.
- Clarify scope, priorities, acceptance hints, and risks **only** along that spine; growth/benchmark gaps must tighten the same story, not a parallel product.
- Do **not** write production code; you may edit docs and task checklists only when they describe intent, not implementation.
- Prefer short, checkable bullets the **디자인** role can turn into contracts/sketches.

EOF
      if [[ "${RALPH_PLANNING_EXPAND_ONLY:-0}" == "1" ]]; then
        cat << 'EOF'
## 병렬 스윕 직후(성장 루프)

에이전트 배치 병합으로 `RALPH_TASK.md` 목록이 **전부 `[x]`**일 수 있다. 문서 **「체크가 가득 찬 뒤」**·**성장 루프**·**동종 비교 → 체크 확장**에 따라, 이번 이터는 **측정 가능한 새 `- [ ]` 항목**을 최소 1개 이상 추가하고(필요 시 한 줄 맥락), 변경을 **커밋한 뒤 `git push`**까지 수행한다(`origin` 원격이 있을 때). 빈 백로그로 종료하지 않는다.

EOF
      fi
      ;;
    design)
      cat << EOF
## Role Boundaries — 디자인 (design)

- Turn planning output into concrete UX/API/data contracts, file touch list, or pseudocode **where it helps implementation**.
- Do **not** land large production patches unless trivial; leave heavy coding to **구현**.
- Call out ambiguities and send corrections back via \`.ralph/progress.md\` if planning was insufficient.

EOF
      ;;
    implementation)
      cat << EOF
## Role Boundaries — 구현 (implementation)

- Implement according to \`RALPH_TASK.md\`, guardrails, and the latest **디자인** notes in \`.ralph/progress.md\` / git.
- Prefer small commits with messages prefixed or tagged so **테스트** can trace intent.
- Do **not** declare criteria \`[x]\` without leaving verifiable steps for the test role.

EOF
      ;;
    test)
      cat << EOF
## Role Boundaries — 테스트 (test)

- Run the repo’s documented checks (e.g. \`npm run build\`, tests in \`RALPH_TASK.md\`).
- Report pass/fail with evidence; fix only what is necessary for green builds or file minimal issues for **구현**/**디자인**.
- You **own** flipping checkboxes to \`[x]\` when verification matches the criterion.

EOF
      ;;
  esac

  if [[ -z "$prior_key" ]]; then
    cat << EOF
## Supervision (감시) — 첫 단계

There is no prior role output in this run yet. Base your plan strictly on \`RALPH_TASK.md\`, \`docs/ralph-guardrails.md\`, and git history.

EOF
  else
    cat << EOF
## Supervision (감시) — 직전 단계: **$prior_ko** (\`$prior_key\`)

Before doing your role’s work:

1. Read **\`.ralph/progress.md\`** from the bottom up — find the latest entry for \`$prior_key\` / **$prior_ko**.
2. Inspect **git** (\`git log -5 --oneline\`, \`git status\`, \`git diff\` as needed) for what that role actually changed.
3. Write a short **감시 요약** in \`.ralph/progress.md\`: what you verified, gaps, and whether the handoff is **승인** or **반려(보완 필요)**. If 반려, list concrete actions; do not silently redo the prior role’s entire work unless critical.

EOF
  fi

  _build_prompt_shared_body "$iteration" "$role_key"
}

# =============================================================================
# SPINNER
# =============================================================================

# Spinner to show the loop is alive (not frozen)
# Outputs to stderr so it's not captured by $()
spinner() {
  local workspace="$1"
  local spin='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
  local i=0
  while true; do
    printf "\r  🐛 Agent working... %s  (watch: tail -f %s/.ralph/activity.log)" "${spin:i++%${#spin}:1}" "$workspace" >&2
    sleep 0.1
  done
}

# =============================================================================
# ITERATION RUNNER
# =============================================================================

# Run a single agent iteration
# Returns: signal (ROTATE, GUTTER, COMPLETE, or empty)
run_iteration() {
  local workspace="$1"
  local iteration="$2"
  local script_dir="${4:-$(dirname "${BASH_SOURCE[0]}")}"

  local role_key=""
  if [[ -n "${RALPH_ROLE_OVERRIDE:-}" ]]; then
    role_key="$RALPH_ROLE_OVERRIDE"
    export RALPH_ROLE="$role_key"
  elif [[ "${RALPH_ROLE_MODE:-cycle}" != "mono" ]]; then
    role_key=$(ralph_role_for_iteration "$iteration")
    export RALPH_ROLE="$role_key"
  else
    unset RALPH_ROLE 2>/dev/null || true
  fi

  local prompt
  prompt=$(build_prompt "$workspace" "$iteration" "$role_key")
  
  # Use stderr for display (stdout is captured for signal)
  echo "" >&2
  echo "═══════════════════════════════════════════════════════════════════" >&2
  if [[ -n "$role_key" ]]; then
    local _rk _cyc _ph
    _rk=$(ralph_role_label_ko "$role_key")
    _cyc=$(( (iteration - 1) / 4 + 1 ))
    _ph=$(( (iteration - 1) % 4 + 1 ))
    echo "🐛 Ralph Iteration $iteration — 역할: $_rk ($role_key) · 사이클 $_cyc · 단계 $_ph/4" >&2
  else
    echo "🐛 Ralph Iteration $iteration (RALPH_ROLE_MODE=mono)" >&2
  fi
  echo "═══════════════════════════════════════════════════════════════════" >&2
  echo "" >&2
  echo "Workspace: $workspace" >&2
  echo "Model:     $MODEL" >&2
  echo "Role mode: ${RALPH_ROLE_MODE:-cycle}" >&2
  echo "Monitor:   tail -f $workspace/.ralph/activity.log" >&2
  echo "" >&2

  # Log session start to progress.md
  if [[ -n "$role_key" ]]; then
    log_progress "$workspace" "**Session $iteration started** — 역할: $(ralph_role_label_ko "$role_key") (\`$role_key\`) · model: $MODEL"
  else
    log_progress "$workspace" "**Session $iteration started** (model: $MODEL, mono role mode)"
  fi

  # stream-parser: JSONL events (.ralph/events.jsonl) include this iteration index
  export RALPH_ITERATION="$iteration"

  local agent_bin
  agent_bin="$(ralph_codex_bin)"
  if [[ -z "$agent_bin" ]]; then
    echo "❌ Codex CLI not found (need: codex in PATH)" >&2
    return 1
  fi

  local codex_home
  codex_home="$(ralph_codex_home "$workspace")"

  local last_message="$workspace/.ralph/last-message.txt"
  local signal_file="$workspace/.ralph/.last-signal"
  : > "$last_message"
  : > "$signal_file"

  local cmd=(
    "$agent_bin"
    -a never
    exec
    --json
    --skip-git-repo-check
    --sandbox workspace-write
    --cd "$workspace"
    --output-last-message "$last_message"
  )
  if [[ -n "$MODEL" ]]; then
    cmd+=(--model "$MODEL")
  fi
  
  # Start spinner to show we're alive
  spinner "$workspace" &
  local spinner_pid=$!
  
  # Start parser in background, reading from codex json output.
  (
    if [[ -n "$codex_home" ]]; then
      mkdir -p "$codex_home"
      printf "%s" "$prompt" | env CODEX_HOME="$codex_home" "${cmd[@]}" - 2>&1
    else
      printf "%s" "$prompt" | "${cmd[@]}" - 2>&1
    fi | "$script_dir/stream-parser.sh" "$workspace" > "$signal_file"
  ) &
  local agent_pid=$!
  
  # Wait for agent to finish
  local agent_rc=0
  wait $agent_pid || agent_rc=$?
  
  # Stop spinner and clear line
  kill $spinner_pid 2>/dev/null || true
  wait $spinner_pid 2>/dev/null || true
  printf "\r\033[K" >&2  # Clear spinner line
  
  local signal=""
  if [[ -s "$signal_file" ]]; then
    signal="$(tail -1 "$signal_file")"
  fi
  if [[ -f "$last_message" ]]; then
    if grep -q "<ralph>COMPLETE</ralph>" "$last_message"; then
      echo "✅ Agent signaled completion!" >&2
      signal="COMPLETE"
    elif grep -q "<ralph>GUTTER</ralph>" "$last_message"; then
      echo "🚨 Agent signaled gutter." >&2
      signal="GUTTER"
    fi
  fi

  if [[ -z "$signal" ]] && [[ $agent_rc -ne 0 ]]; then
    signal="GUTTER"
  fi

  echo "$signal"
}

# =============================================================================
# MAIN LOOP
# =============================================================================

# Run the main Ralph loop
# Args: workspace
# Uses global: MAX_ITERATIONS, MODEL, USE_BRANCH, OPEN_PR
run_ralph_loop() {
  local workspace="$1"
  local script_dir="${2:-$(dirname "${BASH_SOURCE[0]}")}"
  
  # Commit any uncommitted work first
  cd "$workspace"
  if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
    echo "📦 Committing uncommitted changes..."
    git add -A
    git commit -m "ralph: initial commit before loop" || true
  fi
  
  # Create branch if requested
  if [[ -n "$USE_BRANCH" ]]; then
    echo "🌿 Creating branch: $USE_BRANCH"
    git checkout -b "$USE_BRANCH" 2>/dev/null || git checkout "$USE_BRANCH"
  fi
  
  echo ""
  echo "🚀 Starting Ralph loop..."
  echo ""
  
  # Main loop
  local iteration=1
  local session_id=""
  
  while [[ $iteration -le $MAX_ITERATIONS ]]; do
    # Run iteration
    local signal
    signal=$(run_iteration "$workspace" "$iteration" "$session_id" "$script_dir")
    
    # Check task completion
    local task_status
    task_status=$(check_task_complete "$workspace")
    
    if [[ "$task_status" == "COMPLETE" ]]; then
      log_progress "$workspace" "**Session $iteration ended** - ✅ TASK COMPLETE"
      echo ""
      echo "═══════════════════════════════════════════════════════════════════"
      echo "🎉 RALPH COMPLETE! All criteria satisfied."
      echo "═══════════════════════════════════════════════════════════════════"
      echo ""
      echo "Completed in $iteration iteration(s)."
      echo "Check git log for detailed history."
      
      # Open PR if requested
      if [[ "$OPEN_PR" == "true" ]] && [[ -n "$USE_BRANCH" ]]; then
        echo ""
        echo "📝 Opening pull request..."
        git push -u origin "$USE_BRANCH" 2>/dev/null || git push
        if command -v gh &> /dev/null; then
          gh pr create --fill || echo "⚠️  Could not create PR automatically. Create manually."
        else
          echo "⚠️  gh CLI not found. Push complete, create PR manually."
        fi
      fi
      
      return 0
    fi
    
    # Handle signals
    case "$signal" in
      "COMPLETE")
        # Agent signaled completion - verify with checkbox check
        if [[ "$task_status" == "COMPLETE" ]]; then
          log_progress "$workspace" "**Session $iteration ended** - ✅ TASK COMPLETE (agent signaled)"
          echo ""
          echo "═══════════════════════════════════════════════════════════════════"
          echo "🎉 RALPH COMPLETE! Agent signaled completion and all criteria verified."
          echo "═══════════════════════════════════════════════════════════════════"
          echo ""
          echo "Completed in $iteration iteration(s)."
          echo "Check git log for detailed history."
          
          # Open PR if requested
          if [[ "$OPEN_PR" == "true" ]] && [[ -n "$USE_BRANCH" ]]; then
            echo ""
            echo "📝 Opening pull request..."
            git push -u origin "$USE_BRANCH" 2>/dev/null || git push
            if command -v gh &> /dev/null; then
              gh pr create --fill || echo "⚠️  Could not create PR automatically. Create manually."
            else
              echo "⚠️  gh CLI not found. Push complete, create PR manually."
            fi
          fi
          
          return 0
        else
          # Agent said complete but checkboxes say otherwise - continue
          log_progress "$workspace" "**Session $iteration ended** - Agent signaled complete but criteria remain"
          echo ""
          echo "⚠️  Agent signaled completion but unchecked criteria remain."
          echo "   Continuing with next iteration..."
          iteration=$((iteration + 1))
        fi
        ;;
      "ROTATE")
        log_progress "$workspace" "**Session $iteration ended** - 🔄 Context rotation (token limit reached)"
        echo ""
        echo "🔄 Rotating to fresh context..."
        iteration=$((iteration + 1))
        session_id=""
        ;;
      "GUTTER")
        log_progress "$workspace" "**Session $iteration ended** - 🚨 GUTTER (agent stuck)"
        echo ""
        echo "🚨 Gutter detected. Check .ralph/errors.log for details."
        echo "   The agent may be stuck. Consider:"
        echo "   1. Check docs/ralph-guardrails.md for lessons"
        echo "   2. Manually fix the blocking issue"
        echo "   3. Re-run the loop"
        return 1
        ;;
      "DEFER")
        # Rate limit or transient error - wait with exponential backoff then retry
        log_progress "$workspace" "**Session $iteration ended** - ⏸️ DEFERRED (rate limit/transient error)"
        
        # Calculate backoff delay (uses ralph-retry.sh functions if available)
        local defer_delay=30
        if type calculate_backoff_delay &>/dev/null; then
          local defer_attempt=${DEFER_COUNT:-1}
          DEFER_COUNT=$((defer_attempt + 1))
          defer_delay=$(($(calculate_backoff_delay "$defer_attempt" 15 120 true) / 1000))
        fi
        
        echo ""
        echo "⏸️  Rate limit or transient error detected."
        echo "   Waiting ${defer_delay}s before retrying (attempt ${DEFER_COUNT:-1})..."
        sleep "$defer_delay"
        
        # Don't increment iteration - retry the same task
        echo "   Resuming..."
        ;;
      *)
        # Agent finished naturally, check if more work needed
        if [[ "$task_status" == INCOMPLETE:* ]]; then
          local remaining_count=${task_status#INCOMPLETE:}
          log_progress "$workspace" "**Session $iteration ended** - Agent finished naturally ($remaining_count criteria remaining)"
          echo ""
          echo "📋 Agent finished but $remaining_count criteria remaining."
          echo "   Starting next iteration..."
          iteration=$((iteration + 1))
        fi
        ;;
    esac
    
    # Brief pause between iterations
    sleep 2
  done
  
  log_progress "$workspace" "**Loop ended** - ⚠️ Max iterations ($MAX_ITERATIONS) reached"
  echo ""
  echo "⚠️  Max iterations ($MAX_ITERATIONS) reached."
  echo "   Task may not be complete. Check progress manually."
  return 1
}

# =============================================================================
# PREREQUISITE CHECKS
# =============================================================================

# Check all prerequisites, exit with error message if any fail
check_prerequisites() {
  local workspace="$1"
  local task_file="$workspace/RALPH_TASK.md"
  local discovered_root=""
  
  # Check for task file
  if [[ ! -f "$task_file" ]]; then
    echo "❌ No RALPH_TASK.md found in $workspace"
    if discovered_root="$(ralph_find_task_root "$workspace" 2>/dev/null)"; then
      echo "   Found one above instead: $discovered_root/RALPH_TASK.md"
      echo "   Re-run from that directory or update the loop to use that root."
    fi
    echo ""
    echo "Create a task file first:"
    echo "  cat > RALPH_TASK.md << 'EOF'"
    echo "  ---"
    echo "  task: Your task description"
    echo "  test_command: \"pnpm test\""
    echo "  ---"
    echo "  # Task"
    echo "  ## Success Criteria"
    echo "  1. [ ] First thing to do"
    echo "  2. [ ] Second thing to do"
    echo "  EOF"
    return 1
  fi
  
  # Check for Codex CLI
  if [[ -z "$(ralph_codex_bin)" ]]; then
    echo "❌ Codex CLI not found (expected: codex in PATH)"
    echo ""
    echo "Verify:"
    echo "  codex --version"
    return 1
  fi
  
  # Check for git repo
  if ! git -C "$workspace" rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not a git repository"
    echo "   Ralph requires git for state persistence."
    return 1
  fi
  
  return 0
}

# =============================================================================
# DISPLAY HELPERS
# =============================================================================

# Show task summary
show_task_summary() {
  local workspace="$1"
  local task_file="$workspace/RALPH_TASK.md"
  
  echo "📋 Task Summary:"
  echo "─────────────────────────────────────────────────────────────────"
  head -55 "$task_file"
  echo "─────────────────────────────────────────────────────────────────"
  echo ""
  
  # Count criteria - only actual checkbox list items (- [ ], * [x], 1. [ ], etc.)
  local total_criteria done_criteria remaining
  total_criteria=$(grep -cE '^[[:space:]]*([-*]|[0-9]+\.)[[:space:]]+\[(x| )\]' "$task_file" 2>/dev/null) || total_criteria=0
  done_criteria=$(grep -cE '^[[:space:]]*([-*]|[0-9]+\.)[[:space:]]+\[x\]' "$task_file" 2>/dev/null) || done_criteria=0
  remaining=$((total_criteria - done_criteria))
  
  echo "Progress: $done_criteria / $total_criteria criteria complete ($remaining remaining)"
  echo "Model:    $MODEL"
  echo ""
  
  # Return remaining count for caller to check
  echo "$remaining"
}

# Show Ralph banner
show_banner() {
  echo "═══════════════════════════════════════════════════════════════════"
  echo "🐛 Ralph Wiggum: Autonomous Development Loop"
  echo "═══════════════════════════════════════════════════════════════════"
  echo ""
  echo "  \"That's the beauty of Ralph - the technique is deterministically"
  echo "   bad in an undeterministic world.\""
  echo ""
  echo "═══════════════════════════════════════════════════════════════════"
  echo ""
}
