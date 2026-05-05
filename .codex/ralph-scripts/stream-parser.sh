#!/bin/bash
# Ralph Wiggum: Stream Parser
#
# Parses Codex CLI JSON/event output in real time.
# Tracks failures/gutter, writes to .ralph/ logs, and keeps the old event file shape.
#
# Usage:
#   codex -a never exec --json -C /path/to/workspace "..." | ./stream-parser.sh /path/to/workspace
#
# Outputs to stdout:
#   - ROTATE when threshold hit (80k tokens)
#   - WARN when approaching limit (70k tokens)
#   - GUTTER when stuck pattern detected
#   - COMPLETE when agent outputs <ralph>COMPLETE</ralph>
#
# Writes to .ralph/:
#   - activity.log: all operations with context health
#   - errors.log: failures and gutter detection

set -euo pipefail

WORKSPACE="${1:-.}"
RALPH_DIR="$WORKSPACE/.ralph"
EVENTS_JSONL="${RALPH_EVENTS_JSONL:-$RALPH_DIR/events.jsonl}"

# Ensure .ralph directory exists
mkdir -p "$RALPH_DIR"

# Thresholds
WARN_THRESHOLD=70000
ROTATE_THRESHOLD=80000
ACTIVITY_LOG_MAX_LINES="${RALPH_ACTIVITY_LOG_MAX_LINES:-400}"
ERRORS_LOG_MAX_LINES="${RALPH_ERRORS_LOG_MAX_LINES:-200}"
LOG_LINE_MAX_CHARS="${RALPH_LOG_LINE_MAX_CHARS:-400}"

# Tracking state
BYTES_READ=0
BYTES_WRITTEN=0
ASSISTANT_CHARS=0
SHELL_OUTPUT_CHARS=0
PROMPT_CHARS=0
TOOL_CALLS=0
WARN_SENT=0
JSON_EVENTS_SEEN=0

# Estimate initial prompt size (Ralph prompt is ~2KB + file references)
PROMPT_CHARS=3000

# Gutter detection - use temp files instead of associative arrays (macOS bash 3.x compat)
FAILURES_FILE=$(mktemp)
WRITES_FILE=$(mktemp)
trap "rm -f $FAILURES_FILE $WRITES_FILE" EXIT

trim_file_to_last_lines() {
  local file="$1"
  local max_lines="$2"
  local tmp_file
  local line_count

  if [[ -z "$file" ]] || [[ -z "$max_lines" ]] || [[ ! -f "$file" ]]; then
    return 0
  fi

  line_count=$(wc -l < "$file" 2>/dev/null | tr -d '[:space:]')
  if [[ -z "$line_count" ]] || [[ "$line_count" -le "$max_lines" ]]; then
    return 0
  fi

  tmp_file="${file}.tmp.$$"
  tail -n "$max_lines" "$file" > "$tmp_file" && mv "$tmp_file" "$file"
}

# Get context health emoji
get_health_emoji() {
  local tokens=$1
  local pct=$((tokens * 100 / ROTATE_THRESHOLD))
  
  if [[ $pct -lt 60 ]]; then
    echo "🟢"
  elif [[ $pct -lt 80 ]]; then
    echo "🟡"
  else
    echo "🔴"
  fi
}

calc_tokens() {
  local total_bytes=$((PROMPT_CHARS + BYTES_READ + BYTES_WRITTEN + ASSISTANT_CHARS + SHELL_OUTPUT_CHARS))
  echo $((total_bytes / 4))
}

# Structured JSONL for dashboards (e.g. apps/open-graze / OpenGraze). One JSON object per line.
append_event() {
  local kind="$1"
  local detail_json="${2:-null}"
  local est
  est=$(calc_tokens)
  local pct=$(( est * 100 / ROTATE_THRESHOLD ))
  jq -nc \
    --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg kind "$kind" \
    --argjson iteration "${RALPH_ITERATION:-0}" \
    --arg sessionId "${RALPH_SESSION_ID:-}" \
    --argjson estimatedTokens "$est" \
    --argjson contextPct "$pct" \
    --argjson readB "$BYTES_READ" \
    --argjson writeB "$BYTES_WRITTEN" \
    --argjson assistC "$ASSISTANT_CHARS" \
    --argjson shellC "$SHELL_OUTPUT_CHARS" \
    --argjson rot "$ROTATE_THRESHOLD" \
    --argjson detail "$detail_json" \
    '{
      ts: $ts,
      kind: $kind,
      iteration: $iteration,
      sessionId: $sessionId,
      estimatedTokens: $estimatedTokens,
      contextWindowPct: $contextPct,
      rotateThreshold: $rot,
      tokenBreakdown: {readBytes:$readB, writeBytes:$writeB, assistantChars:$assistC, shellChars:$shellC},
      detail: (if ($detail|type) == "null" then null else $detail end)
    }' >> "$EVENTS_JSONL" 2>/dev/null || true
}

# Log to activity.log
log_activity() {
  local message="$1"
  local timestamp=$(date '+%H:%M:%S')
  local tokens=$(calc_tokens)
  local emoji=$(get_health_emoji $tokens)
  
  echo "[$timestamp] $emoji $(truncate_inline_text "$message" "$LOG_LINE_MAX_CHARS")" >> "$RALPH_DIR/activity.log"
  trim_file_to_last_lines "$RALPH_DIR/activity.log" "$ACTIVITY_LOG_MAX_LINES"
}

# Log to errors.log
log_error() {
  local message="$1"
  local timestamp=$(date '+%H:%M:%S')
  
  echo "[$timestamp] $(truncate_inline_text "$message" "$LOG_LINE_MAX_CHARS")" >> "$RALPH_DIR/errors.log"
  trim_file_to_last_lines "$RALPH_DIR/errors.log" "$ERRORS_LOG_MAX_LINES"
}

normalize_inline_text() {
  local text="${1:-}"
  text="${text//$'\n'/ }"
  text="${text//$'\r'/ }"
  text="$(echo "$text" | tr -s '[:space:]' ' ' | sed 's/^ //; s/ $//')"
  echo "$text"
}

truncate_inline_text() {
  local text
  text="$(normalize_inline_text "${1:-}")"
  local max_len="${2:-140}"
  if [[ ${#text} -gt $max_len ]]; then
    echo "${text:0:max_len}..."
  else
    echo "$text"
  fi
}

should_log_raw_line() {
  local line="${1:-}"
  [[ "$line" == \{* ]] && return 1
  [[ "$line" == \[* ]] && return 1
  local lower
  lower=$(printf '%s' "$line" | tr '[:upper:]' '[:lower:]')
  [[ "$lower" == *" warn "* ]] || [[ "$lower" == warn* ]] || [[ "$lower" == *" error "* ]] || [[ "$lower" == error* ]] || [[ "$lower" == *"forbidden"* ]] || [[ "$lower" == *"unauthorized"* ]] || [[ "$lower" == *"failed"* ]] || [[ "$lower" == *"challenge"* ]]
}

log_raw_diagnostic_line() {
  local line
  line="$(truncate_inline_text "${1:-}" 220)"
  [[ -z "$line" ]] && return
  if should_log_raw_line "$line"; then
    log_activity "RAW $line"
    log_error "RAW DIAG: $line"
    append_event "raw_diag" "$(jq -nc --arg text "$line" '{text:$text}')"
  fi
}

# Check and log token status
log_token_status() {
  local tokens=$(calc_tokens)
  local pct=$((tokens * 100 / ROTATE_THRESHOLD))
  local emoji=$(get_health_emoji $tokens)
  local timestamp=$(date '+%H:%M:%S')
  
  local status_msg="TOKENS: $tokens / $ROTATE_THRESHOLD ($pct%)"
  
  if [[ $pct -ge 90 ]]; then
    status_msg="$status_msg - rotation imminent"
  elif [[ $pct -ge 72 ]]; then
    status_msg="$status_msg - approaching limit"
  fi
  
  local breakdown="[read:$((BYTES_READ/1024))KB write:$((BYTES_WRITTEN/1024))KB assist:$((ASSISTANT_CHARS/1024))KB shell:$((SHELL_OUTPUT_CHARS/1024))KB]"
  echo "[$timestamp] $emoji $(truncate_inline_text "$status_msg $breakdown" "$LOG_LINE_MAX_CHARS")" >> "$RALPH_DIR/activity.log"
  trim_file_to_last_lines "$RALPH_DIR/activity.log" "$ACTIVITY_LOG_MAX_LINES"
  append_event "token_snapshot" "$(jq -nc --argjson t "$tokens" --argjson p "$pct" --arg s "$status_msg" --arg b "$breakdown" '{tokens:$t,contextPct:$p,summary:$s,breakdownLabel:$b}')"
}

# Check if an error message indicates a retryable API error
# Returns: 0 if retryable (should defer), 1 if not retryable
is_retryable_api_error() {
  local error_msg="$1"
  local lower_msg
  lower_msg=$(echo "$error_msg" | tr '[:upper:]' '[:lower:]')
  
  # Rate limit patterns
  if [[ "$lower_msg" =~ (rate[[:space:]]*limit|rate_limit|rate-limit) ]] || \
     [[ "$lower_msg" =~ (quota[[:space:]]*exceeded|quota[[:space:]]*limit|hit[[:space:]]*your[[:space:]]*limit) ]] || \
     [[ "$lower_msg" =~ (too[[:space:]]*many[[:space:]]*requests|429|http[[:space:]]*429) ]]; then
    return 0
  fi
  
  # Network/connection patterns
  if [[ "$lower_msg" =~ (timeout|timed[[:space:]]*out|connection[[:space:]]*timeout) ]] || \
     [[ "$lower_msg" =~ (network[[:space:]]*error|network[[:space:]]*unavailable) ]] || \
     [[ "$lower_msg" =~ (connection[[:space:]]*refused|connection[[:space:]]*reset|econnreset) ]] || \
     [[ "$lower_msg" =~ (connection[[:space:]]*closed|connection[[:space:]]*failed|etimedout|enotfound) ]]; then
    return 0
  fi
  
  # Server error patterns
  if [[ "$lower_msg" =~ (service[[:space:]]*unavailable|503) ]] || \
     [[ "$lower_msg" =~ (bad[[:space:]]*gateway|502) ]] || \
     [[ "$lower_msg" =~ (gateway[[:space:]]*timeout|504) ]] || \
     [[ "$lower_msg" =~ (overloaded|server[[:space:]]*busy|try[[:space:]]*again) ]]; then
    return 0
  fi
  
  return 1  # Not retryable
}

is_model_access_error() {
  local error_msg="$1"
  local lower_msg
  lower_msg=$(echo "$error_msg" | tr '[:upper:]' '[:lower:]')
  [[ "$lower_msg" == *"not supported when using codex with a chatgpt account"* ]]
}

# Check for gutter conditions
check_gutter() {
  local tokens=$(calc_tokens)
  
  # Check rotation threshold
  if [[ $tokens -ge $ROTATE_THRESHOLD ]]; then
    log_activity "ROTATE: Token threshold reached ($tokens >= $ROTATE_THRESHOLD)"
    append_event "context_rotate" "$(jq -nc --argjson t "$tokens" '{reason:"threshold",tokens:$t}')"
    echo "ROTATE" 2>/dev/null || true
    return
  fi
  
  # Check warning threshold (only emit once per session)
  if [[ $tokens -ge $WARN_THRESHOLD ]] && [[ $WARN_SENT -eq 0 ]]; then
    log_activity "WARN: Approaching token limit ($tokens >= $WARN_THRESHOLD)"
    append_event "context_warn" "$(jq -nc --argjson t "$tokens" '{tokens:$t}')"
    WARN_SENT=1
    echo "WARN" 2>/dev/null || true
  fi
}

# Track shell command failure
track_shell_failure() {
  local cmd="$1"
  local exit_code="$2"
  
  if [[ $exit_code -ne 0 ]]; then
    # Count failures for this command (grep -c exits 1 if no match, so use || true)
    local count
    count=$(grep -c "^${cmd}$" "$FAILURES_FILE" 2>/dev/null) || count=0
    count=$((count + 1))
    echo "$cmd" >> "$FAILURES_FILE"
    
    log_error "SHELL FAIL: $cmd → exit $exit_code (attempt $count)"
    
    if [[ $count -ge 3 ]]; then
      log_error "⚠️ GUTTER: same command failed ${count}x"
      echo "GUTTER" 2>/dev/null || true
    fi
  fi
}

# Track file writes for thrashing detection
track_file_write() {
  local path="$1"
  local now=$(date +%s)
  
  # Log write with timestamp
  echo "$now:$path" >> "$WRITES_FILE"
  
  # Count writes to this file in last 10 minutes
  local cutoff=$((now - 600))
  local count=$(awk -F: -v cutoff="$cutoff" -v path="$path" '
    $1 >= cutoff && $2 == path { count++ }
    END { print count+0 }
  ' "$WRITES_FILE")
  
  # Check for thrashing (5+ writes in 10 minutes)
  if [[ $count -ge 5 ]]; then
    log_error "⚠️ THRASHING: $path written ${count}x in 10 min"
    echo "GUTTER" 2>/dev/null || true
  fi
}

# Process a single JSON line from stream
process_line() {
  local line="$1"
  
  # Skip empty lines
  [[ -z "$line" ]] && return

  if ! echo "$line" | jq -e '.' >/dev/null 2>&1; then
    log_raw_diagnostic_line "$line"
    return
  fi

  if [[ "$line" == *"<ralph>COMPLETE</ralph>"* ]]; then
    log_activity "✅ Agent signaled COMPLETE"
    append_event "ralph_complete" "null"
    echo "COMPLETE" 2>/dev/null || true
  fi

  if [[ "$line" == *"<ralph>GUTTER</ralph>"* ]]; then
    log_activity "🚨 Agent signaled GUTTER (stuck)"
    append_event "ralph_gutter_sigil" "null"
    echo "GUTTER" 2>/dev/null || true
  fi

  # Parse JSON type
  JSON_EVENTS_SEEN=1
  local type=$(echo "$line" | jq -r '.type // empty' 2>/dev/null) || return
  local subtype=$(echo "$line" | jq -r '.subtype // empty' 2>/dev/null) || true
  
  case "$type" in
    "system")
      if [[ "$subtype" == "init" ]]; then
        local model=$(echo "$line" | jq -r '.model // "unknown"' 2>/dev/null) || model="unknown"
        log_activity "SESSION START: model=$model"
        append_event "model_init" "$(jq -nc --arg m "$model" '{model:$m}')"
      fi
      ;;
    
    "error")
      # Handle API/engine errors
      local error_msg
      error_msg=$(echo "$line" | jq -r '.error.data.message // .error.message // .message // "Unknown error"' 2>/dev/null) || error_msg="Unknown error"
      
      log_error "API ERROR: $error_msg"
      log_activity "❌ API ERROR: $error_msg"
      append_event "api_error" "$(jq -nc --arg m "$error_msg" '{message:$m}')"

      if is_model_access_error "$error_msg"; then
        log_error "↪️ MODEL FALLBACK: current model is not allowed for this Codex account"
        append_event "model_fallback_requested" "$(jq -nc --arg m "$error_msg" '{message:$m}')"
        echo "MODEL_FALLBACK" 2>/dev/null || true
        return
      fi
      
      # Check if this is a retryable error (rate limit, network, etc.)
      if is_retryable_api_error "$error_msg"; then
        log_error "⚠️ RETRYABLE: Error may be transient (rate limit/network)"
        append_event "api_error_defer" "$(jq -nc --arg m "$error_msg" '{message:$m,retryable:true}')"
        echo "DEFER" 2>/dev/null || true
      else
        log_error "🚨 NON-RETRYABLE: Error requires attention"
        echo "GUTTER" 2>/dev/null || true
      fi
      ;;

    "item.started")
      local item_type
      item_type=$(echo "$line" | jq -r '.item.type // empty' 2>/dev/null) || item_type=""
      case "$item_type" in
        "command_execution")
          local cmd
          cmd=$(echo "$line" | jq -r '.item.command // empty' 2>/dev/null) || cmd=""
          [[ -n "$cmd" ]] && log_activity "RUN $(truncate_inline_text "$cmd" 160)"
          ;;
      esac
      ;;

    "item.completed")
      local item_type
      item_type=$(echo "$line" | jq -r '.item.type // empty' 2>/dev/null) || item_type=""
      case "$item_type" in
        "command_execution")
          local cmd exit_code aggregated_output output_chars
          cmd=$(echo "$line" | jq -r '.item.command // "unknown"' 2>/dev/null) || cmd="unknown"
          exit_code=$(echo "$line" | jq -r '.item.exit_code // .item.exitCode // 0' 2>/dev/null) || exit_code=0
          aggregated_output=$(echo "$line" | jq -r '.item.aggregated_output // ""' 2>/dev/null) || aggregated_output=""
          output_chars=${#aggregated_output}
          SHELL_OUTPUT_CHARS=$((SHELL_OUTPUT_CHARS + output_chars))

          if [[ "$exit_code" -eq 0 ]]; then
            if [[ "$output_chars" -gt 0 ]]; then
              log_activity "COMMAND $(truncate_inline_text "$cmd" 120) → exit 0 · $(truncate_inline_text "$aggregated_output" 180)"
            else
              log_activity "COMMAND $(truncate_inline_text "$cmd" 160) → exit 0"
            fi
          else
            log_activity "COMMAND $(truncate_inline_text "$cmd" 160) → exit $exit_code"
            track_shell_failure "$cmd" "$exit_code"
          fi

          append_event "tool_shell" "$(jq -nc --arg cmd "$cmd" --argjson ec "$exit_code" --argjson oc "$output_chars" '{command:$cmd,exitCode:$ec,outputChars:$oc,source:"command_execution"}')"
          check_gutter
          ;;
        "assistant_message")
          local text chars
          text=$(echo "$line" | jq -r '.item.text // .item.content[0].text // .item.content[0].text.value // empty' 2>/dev/null) || text=""
          if [[ -n "$text" ]]; then
            chars=${#text}
            ASSISTANT_CHARS=$((ASSISTANT_CHARS + chars))
            log_activity "ASSISTANT $(truncate_inline_text "$text" 180)"
            append_event "assistant_summary" "$(jq -nc --arg text "$(truncate_inline_text "$text" 400)" --argjson chars "$chars" '{text:$text,chars:$chars}')"
          fi
          ;;
        "reasoning")
          local summary
          summary=$(echo "$line" | jq -r '.item.summary[0].text // .item.text // empty' 2>/dev/null) || summary=""
          if [[ -n "$summary" ]]; then
            log_activity "REASONING $(truncate_inline_text "$summary" 180)"
            append_event "reasoning_summary" "$(jq -nc --arg text "$(truncate_inline_text "$summary" 400)" '{text:$text}')"
          fi
          ;;
      esac
      ;;
      
    "assistant")
      # Track assistant message characters
      local text=$(echo "$line" | jq -r '.message.content[0].text // empty' 2>/dev/null) || text=""
      if [[ -n "$text" ]]; then
        local chars=${#text}
        ASSISTANT_CHARS=$((ASSISTANT_CHARS + chars))
        log_activity "ASSISTANT $(truncate_inline_text "$text" 180)"
        append_event "assistant_summary" "$(jq -nc --arg text "$(truncate_inline_text "$text" 400)" --argjson chars "$chars" '{text:$text,chars:$chars}')"
        
        # Check for completion sigil
        if [[ "$text" == *"<ralph>COMPLETE</ralph>"* ]]; then
          log_activity "✅ Agent signaled COMPLETE"
          append_event "ralph_complete" "null"
          echo "COMPLETE" 2>/dev/null || true
        fi
        
        # Check for gutter sigil
        if [[ "$text" == *"<ralph>GUTTER</ralph>"* ]]; then
          log_activity "🚨 Agent signaled GUTTER (stuck)"
          append_event "ralph_gutter_sigil" "null"
          echo "GUTTER" 2>/dev/null || true
        fi
      fi
      ;;
      
    "tool_call")
      if [[ "$subtype" == "started" ]]; then
        TOOL_CALLS=$((TOOL_CALLS + 1))
        
      elif [[ "$subtype" == "completed" ]]; then
        # Handle read tool completion
        if echo "$line" | jq -e '.tool_call.readToolCall.result.success' > /dev/null 2>&1; then
          local path=$(echo "$line" | jq -r '.tool_call.readToolCall.args.path // "unknown"' 2>/dev/null) || path="unknown"
          local lines=$(echo "$line" | jq -r '.tool_call.readToolCall.result.success.totalLines // 0' 2>/dev/null) || lines=0
          
          local content_size=$(echo "$line" | jq -r '.tool_call.readToolCall.result.success.contentSize // 0' 2>/dev/null) || content_size=0
          local bytes
          if [[ $content_size -gt 0 ]]; then
            bytes=$content_size
          else
            bytes=$((lines * 100))  # ~100 chars/line for code
          fi
          BYTES_READ=$((BYTES_READ + bytes))
          
          local kb=$(echo "scale=1; $bytes / 1024" | bc 2>/dev/null || echo "$((bytes / 1024))")
          log_activity "READ $path ($lines lines, ~${kb}KB)"
          append_event "tool_read" "$(jq -nc --arg path "$path" --argjson lines "$lines" --argjson bytes "$bytes" '{path,lines,bytes}')"
          
        # Handle write tool completion
        elif echo "$line" | jq -e '.tool_call.writeToolCall.result.success' > /dev/null 2>&1; then
          local path=$(echo "$line" | jq -r '.tool_call.writeToolCall.args.path // "unknown"' 2>/dev/null) || path="unknown"
          local lines=$(echo "$line" | jq -r '.tool_call.writeToolCall.result.success.linesCreated // 0' 2>/dev/null) || lines=0
          local bytes=$(echo "$line" | jq -r '.tool_call.writeToolCall.result.success.fileSize // 0' 2>/dev/null) || bytes=0
          BYTES_WRITTEN=$((BYTES_WRITTEN + bytes))
          
          local kb=$(echo "scale=1; $bytes / 1024" | bc 2>/dev/null || echo "$((bytes / 1024))")
          log_activity "WRITE $path ($lines lines, ${kb}KB)"
          append_event "tool_write" "$(jq -nc --arg path "$path" --argjson lines "$lines" --argjson bytes "$bytes" '{path,lines,bytes}')"
          
          # Track for thrashing detection
          track_file_write "$path"
          
        # Handle shell tool completion
        elif echo "$line" | jq -e '.tool_call.shellToolCall.result' > /dev/null 2>&1; then
          local cmd=$(echo "$line" | jq -r '.tool_call.shellToolCall.args.command // "unknown"' 2>/dev/null) || cmd="unknown"
          local exit_code=$(echo "$line" | jq -r '.tool_call.shellToolCall.result.exitCode // 0' 2>/dev/null) || exit_code=0
          
          local stdout=$(echo "$line" | jq -r '.tool_call.shellToolCall.result.stdout // ""' 2>/dev/null) || stdout=""
          local stderr=$(echo "$line" | jq -r '.tool_call.shellToolCall.result.stderr // ""' 2>/dev/null) || stderr=""
          local output_chars=$((${#stdout} + ${#stderr}))
          SHELL_OUTPUT_CHARS=$((SHELL_OUTPUT_CHARS + output_chars))
          
          if [[ $exit_code -eq 0 ]]; then
            if [[ $output_chars -gt 1024 ]]; then
              log_activity "SHELL $cmd → exit 0 (${output_chars} chars output)"
            else
              log_activity "SHELL $cmd → exit 0"
            fi
          else
            log_activity "SHELL $cmd → exit $exit_code"
            track_shell_failure "$cmd" "$exit_code"
          fi
          append_event "tool_shell" "$(jq -nc --arg cmd "$cmd" --argjson ec "$exit_code" --argjson oc "$output_chars" '{command:$cmd,exitCode:$ec,outputChars:$oc}')"
        fi
        
        # Check thresholds after each tool call
        check_gutter
      fi
      ;;
      
    "result")
      local duration=$(echo "$line" | jq -r '.duration_ms // 0' 2>/dev/null) || duration=0
      local tokens=$(calc_tokens)
      log_activity "SESSION END: ${duration}ms, ~$tokens tokens used"
      append_event "session_end" "$(jq -nc --argjson ms "$duration" --argjson tok "$tokens" '{durationMs:$ms,estimatedTokensAtEnd:$tok}')"
      ;;
  esac
}

# Main loop: read JSON lines from stdin
main() {
  if [[ -z "${RALPH_SESSION_ID:-}" ]]; then
    RALPH_SESSION_ID="$(date +%s)-$$"
  fi
  export RALPH_SESSION_ID

  # Initialize activity log for this session
  echo "" >> "$RALPH_DIR/activity.log"
  echo "═══════════════════════════════════════════════════════════════" >> "$RALPH_DIR/activity.log"
  echo "Ralph Session Started: $(date)" >> "$RALPH_DIR/activity.log"
  echo "═══════════════════════════════════════════════════════════════" >> "$RALPH_DIR/activity.log"

  if [[ -n "${RALPH_ROLE:-}" ]]; then
    append_event "session_start" "$(jq -nc --arg ws "$WORKSPACE" --arg sid "$RALPH_SESSION_ID" --arg role "$RALPH_ROLE" '{workspace:$ws,sessionId:$sid,role:$role}')"
  else
    append_event "session_start" "$(jq -nc --arg ws "$WORKSPACE" --arg sid "$RALPH_SESSION_ID" '{workspace:$ws,sessionId:$sid}')"
  fi
  
  # Track last token log time
  local last_token_log=$(date +%s)
  
  while IFS= read -r line; do
    process_line "$line"
    
    # Log token status every 30 seconds
    local now=$(date +%s)
    if [[ $((now - last_token_log)) -ge 30 ]]; then
      log_token_status
      last_token_log=$now
    fi
  done
  
  # Final token status
  log_token_status
  if [[ "$JSON_EVENTS_SEEN" -eq 0 ]]; then
    log_error "STREAM PARSER: no JSON events were parsed from codex output"
    append_event "stream_no_json" "null"
  fi
}

main
