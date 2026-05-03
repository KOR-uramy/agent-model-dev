#!/bin/bash
# Ralph Wiggum: The Loop (CLI Mode)
#
# Runs cursor-agent locally with stream-json parsing for accurate token tracking.
# Handles context rotation via --resume when thresholds are hit.
#
# This script is for power users and scripting. For interactive use, see ralph-setup.sh.
#
# Usage:
#   ./ralph-loop.sh                              # Start from current directory
#   ./ralph-loop.sh /path/to/project             # Start from specific project
#   ./ralph-loop.sh -n 50 -m opus-4.5-thinking   # Custom iterations and model (default model: auto)
#   ./ralph-loop.sh --branch feature/foo --pr   # Create branch and PR
#   ./ralph-loop.sh -y                           # Skip confirmation (for scripting)
#   ./ralph-loop.sh -y --infinite                # No iteration cap (until all [x] or GUTTER / Ctrl-C)
#   ./ralph-loop.sh -y --infinite --force        # Same, but run even when every checkbox is already [x]
#
# Flags:
#   -n, --iterations N     Max iterations (default: 20). Use 0 for unlimited.
#   -m, --model MODEL      Model to use (default: auto; override with RALPH_MODEL)
#   --branch NAME          Sequential: create/work on branch; Parallel: integration branch name
#   --pr                   Sequential: open PR (requires --branch); Parallel: open ONE integration PR (branch optional)
#   --parallel             Run tasks in parallel with worktrees
#   --max-parallel N       Max parallel agents (default: 3)
#   --no-merge             Skip auto-merge in parallel mode
#   -y, --yes              Skip confirmation prompt
#   --infinite             Same as -n 0 (no cap; tmux + interrupt 권장)
#   --force                RALPH_TASK.md가 전부 [x]여도 여기서 종료하지 않고 루프 진입(또는 env FORCE_RALPH_TASK_GUARD=1)
#   -h, --help             Show this help
#
# Requirements:
#   - RALPH_TASK.md in the project root
#   - Git repository
#   - cursor-agent CLI installed

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source common functions
source "$SCRIPT_DIR/ralph-common.sh"
source "$SCRIPT_DIR/task-parser.sh"

# Source parallel execution (if available)
if [[ -f "$SCRIPT_DIR/ralph-parallel.sh" ]]; then
  source "$SCRIPT_DIR/ralph-parallel.sh"
fi

# =============================================================================
# FLAG PARSING
# =============================================================================

show_help() {
  cat << 'EOF'
Ralph Wiggum: The Loop (CLI Mode)

Usage:
  ./ralph-loop.sh [options] [workspace]

Options:
  -n, --iterations N     Max iterations (default: 20). 0 = unlimited until task done / GUTTER / interrupt
  --infinite             Same as -n 0
  -m, --model MODEL      Model to use (default: auto; env RALPH_MODEL)
  --branch NAME          Sequential: create/work on branch; Parallel: integration branch name
  --pr                   Sequential: open PR (requires --branch); Parallel: open ONE integration PR (branch optional)
  --parallel             Run tasks in parallel with worktrees
  --max-parallel N       Max parallel agents (default: 3)
  --no-merge             Skip auto-merge in parallel mode
  -y, --yes              Skip confirmation prompt
  --force, -f            RALPH_TASK.md 체크가 모두 [x]여도 루프·병렬 진입(기본은 즉시 종료)
  -h, --help             Show this help

Examples:
  ./ralph-loop.sh                                    # Interactive mode
  ./ralph-loop.sh -n 50                              # 50 iterations max
  ./ralph-loop.sh -y --infinite                      # No iteration cap (use tmux)
  ./ralph-loop.sh -m gpt-5.2-high                    # Use GPT model
  ./ralph-loop.sh --branch feature/api --pr -y      # Scripted PR workflow
  ./ralph-loop.sh --parallel --max-parallel 4        # Run 4 agents in parallel
  
Environment:
  RALPH_MODEL            Override default model (same as -m; default in repo: auto)
  RALPH_ROLE_MODE        cycle (기본): 이터마다 기획→디자인→구현→테스트 순환, 직전 역할 산출물 감시
                         mono: 역할 구분 없이 기존 단일 프롬프트
  FORCE_RALPH_TASK_GUARD 1 이면 --force와 동일(전부 [x]여도 조기 종료 안 함)
  RALPH_MERGE_AUTOCOMMIT 병렬·병합: 미설정이면 기본 1(병합 전 git add -A 스냅샷 커밋). 0=끔.
  RALPH_MERGE_AUTOSTASH  병합 전 stash(-u). 둘 다 미설정일 때만 AUTOCOMMIT 기본 적용.

For interactive setup with a beautiful UI, use ralph-setup.sh instead.
EOF
}

# Parallel mode settings
PARALLEL_MODE=false
MAX_PARALLEL=3
SKIP_MERGE=false
# 1이면 «전부 [x]» 조기 종료를 건너뜀 (--force 또는 환경 변수 FORCE_RALPH_TASK_GUARD=1)
FORCE_RALPH_TASK_GUARD="${FORCE_RALPH_TASK_GUARD:-0}"

# Parse command line arguments
WORKSPACE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--iterations)
      # 흔한 실수: -n --infinite → --infinite만 쓰거나 -n 0 을 기대함
      if [[ "${2:-}" == "--infinite" ]]; then
        MAX_ITERATIONS="0"
        shift 2
      elif [[ "${2:-}" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$2"
        shift 2
      else
        echo "❌ -n 다음에는 0 이상의 정수만 옵니다 (예: -n 5, -n 0)." >&2
        echo "   무제한:  --infinite   또는   -n 0   (실수로 -n --infinite 를 썼다면 그 조합도 허용)" >&2
        exit 1
      fi
      ;;
    -m|--model)
      MODEL="$2"
      shift 2
      ;;
    --branch)
      USE_BRANCH="$2"
      shift 2
      ;;
    --pr)
      OPEN_PR=true
      shift
      ;;
    --parallel)
      PARALLEL_MODE=true
      shift
      ;;
    --max-parallel)
      MAX_PARALLEL="$2"
      PARALLEL_MODE=true
      shift 2
      ;;
    --no-merge)
      SKIP_MERGE=true
      shift
      ;;
    -y|--yes)
      SKIP_CONFIRM=true
      shift
      ;;
    --infinite)
      MAX_ITERATIONS="0"
      shift
      ;;
    --force|-f)
      FORCE_RALPH_TASK_GUARD=1
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    -*)
      echo "Unknown option: $1"
      echo "Use -h for help."
      exit 1
      ;;
    *)
      # Positional argument = workspace
      WORKSPACE="$1"
      shift
      ;;
  esac
done

# -n 0 / --infinite / (실수) -n --infinite → 사실상 무제한 (성공 기준 전부 [x]·GUTTER·Ctrl-C까지)
if [[ "${MAX_ITERATIONS:-20}" =~ ^-?[0-9]+$ ]] && [[ "${MAX_ITERATIONS:-20}" -le 0 ]]; then
  export RALPH_INFINITE_LOOP=1
  MAX_ITERATIONS=2147483647
  echo "♾️  Iteration cap: none (stop when RALPH_TASK criteria all [x], on GUTTER, or Ctrl-C)." >&2
fi

# =============================================================================
# MAIN
# =============================================================================

main() {
  # Resolve workspace
  if [[ -z "$WORKSPACE" ]]; then
    WORKSPACE="$(pwd)"
  elif [[ "$WORKSPACE" == "." ]]; then
    WORKSPACE="$(pwd)"
  else
    WORKSPACE="$(cd "$WORKSPACE" && pwd)"
  fi
  
  local task_file="$WORKSPACE/RALPH_TASK.md"
  
  # Show banner
  show_banner
  
  # Check prerequisites
  if ! check_prerequisites "$WORKSPACE"; then
    exit 1
  fi
  
  # Validate: PR requires branch (sequential mode only)
  if [[ "$PARALLEL_MODE" != "true" ]] && [[ "$OPEN_PR" == "true" ]] && [[ -z "$USE_BRANCH" ]]; then
    echo "❌ --pr requires --branch (sequential mode)"
    echo "   Example: ./ralph-loop.sh --branch feature/foo --pr"
    exit 1
  fi
  
  # Initialize .ralph directory
  init_ralph_dir "$WORKSPACE"
  
  echo "Workspace: $WORKSPACE"
  echo "Task:      $task_file"
  echo ""
  
  # Show task summary
  echo "📋 Task Summary:"
  echo "─────────────────────────────────────────────────────────────────"
  head -55 "$task_file"
  echo "─────────────────────────────────────────────────────────────────"
  echo ""
  
  # Count criteria
  local total_criteria done_criteria remaining
  # Only count actual checkbox list items (- [ ], * [x], 1. [ ], etc.)
  total_criteria=$(grep -cE '^[[:space:]]*([-*]|[0-9]+\.)[[:space:]]+\[(x| )\]' "$task_file" 2>/dev/null) || total_criteria=0
  done_criteria=$(grep -cE '^[[:space:]]*([-*]|[0-9]+\.)[[:space:]]+\[x\]' "$task_file" 2>/dev/null) || done_criteria=0
  remaining=$((total_criteria - done_criteria))
  
  echo "Progress: $done_criteria / $total_criteria criteria complete ($remaining remaining)"
  echo "Model:    $MODEL"
  if [[ "${RALPH_INFINITE_LOOP:-0}" == "1" ]]; then
    echo "Max iter: unlimited (-n 0 / --infinite)"
  else
    echo "Max iter: $MAX_ITERATIONS"
  fi
  [[ -n "$USE_BRANCH" ]] && echo "Branch:   $USE_BRANCH"
  [[ "$OPEN_PR" == "true" ]] && echo "Open PR:  Yes"
  [[ "$PARALLEL_MODE" == "true" ]] && echo "Parallel: Yes ($MAX_PARALLEL agents)"
  [[ "$SKIP_MERGE" == "true" ]] && echo "Merge:    Skipped"
  echo ""
  
  if [[ "$remaining" -eq 0 ]] && [[ "$total_criteria" -gt 0 ]] && [[ "${FORCE_RALPH_TASK_GUARD:-0}" != "1" ]]; then
    echo "🎉 Task already complete! All criteria are checked."
    echo "   (한국어) RALPH_TASK.md 목록 체크가 모두 [x]라 에이전트를 띄우지 않고 종료합니다."
    echo ""
    echo "집계: RALPH_TASK.md 안에서 줄 시작이 «- [ ]» 또는 «- [x]»(또는 «*», «1.»)인 목록만 센다."
    echo "그래도 루프를 돌리려면: ./ralph-loop.sh --force …  또는  FORCE_RALPH_TASK_GUARD=1 ./ralph-loop.sh …"
    if [[ "$PARALLEL_MODE" == "true" ]]; then
      echo "병렬(--parallel / --max-parallel): 미완 «- [ ]»가 없으면 에이전트를 띄우지 않고 여기서 종료한다."
      echo "이어 돌리려면 새 기준을 «- [ ]»로 추가하거나, 검증 전 항목을 «[ ]»로 되돌린 뒤 다시 실행하라."
    fi
    exit 0
  fi

  if [[ "$remaining" -eq 0 ]] && [[ "$total_criteria" -gt 0 ]] && [[ "${FORCE_RALPH_TASK_GUARD:-0}" == "1" ]]; then
    echo "⚠️  RALPH_TASK.md는 모두 [x]이지만 --force (또는 FORCE_RALPH_TASK_GUARD=1)로 루프를 계속합니다." >&2
    echo "" >&2
  fi
  
  # Confirm before starting (unless -y flag)
  if [[ "$SKIP_CONFIRM" != "true" ]]; then
    echo "This will run cursor-agent locally to work on this task."
    echo "The agent will be rotated when context fills up (~80k tokens)."
    echo ""
    echo "Tip: Use ralph-setup.sh for interactive model/option selection."
    echo "     Use -y flag to skip this prompt."
    echo ""
    read -p "Start Ralph loop? [y/N] " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Aborted."
      exit 0
    fi
  fi
  
  # Run in parallel or sequential mode
  if [[ "$PARALLEL_MODE" == "true" ]]; then
    # Check if parallel functions are available
    if ! type run_parallel_tasks &>/dev/null; then
      echo "❌ Parallel execution not available (ralph-parallel.sh not found)"
      exit 1
    fi
    
    # Export settings for parallel execution
    export MODEL
    export SKIP_MERGE

    # Parallel PR behavior: one integration branch + one PR
    export CREATE_PR="$OPEN_PR"

    # 병합 단계: 로컬·에이전트 산출로 main 이 더러우면 merge 가 전부 거부되므로,
    # 사용자가 둘 다 지정하지 않았을 때만 기본으로 스냅샷 커밋(비활성: RALPH_MERGE_AUTOCOMMIT=0).
    if [[ "$SKIP_MERGE" != "true" ]]; then
      if [[ -z "${RALPH_MERGE_AUTOCOMMIT+x}" ]] && [[ -z "${RALPH_MERGE_AUTOSTASH+x}" ]]; then
        export RALPH_MERGE_AUTOCOMMIT=1
      fi
    fi

    local base_branch
    base_branch="$(git -C "$WORKSPACE" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")"

    # Args: workspace, max_parallel, base_branch, integration_branch(optional)
    run_parallel_tasks "$WORKSPACE" "$MAX_PARALLEL" "$base_branch" "$USE_BRANCH"
    exit $?
  else
    # Run the sequential loop
    run_ralph_loop "$WORKSPACE" "$SCRIPT_DIR"
    exit $?
  fi
}

main
