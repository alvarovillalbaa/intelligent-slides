#!/usr/bin/env bash
#
# Stop hook: force one last agentic completion pass before the agent stops.
#
# Set AGENTIC_DEV_MAX to change the max continuation count (default: 10, 0 = infinite).
#
set -euo pipefail

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path')
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')

COUNTER_DIR="${TMPDIR:-/tmp}/agentic-development"
mkdir -p "$COUNTER_DIR"
COUNTER_FILE="${COUNTER_DIR}/${SESSION_ID}"
MAX=${AGENTIC_DEV_MAX:-10}

COUNT=0
if [ -f "$COUNTER_FILE" ]; then
  COUNT=$(cat "$COUNTER_FILE")
fi

if [ "$MAX" -gt 0 ] && [ "$COUNT" -ge "$MAX" ]; then
  rm -f "$COUNTER_FILE"
  exit 0
fi

HAS_INCOMPLETE_SIGNALS=false

if [ -f "$TRANSCRIPT" ]; then
  TAIL=$(tail -80 "$TRANSCRIPT" 2>/dev/null || true)

  if echo "$TAIL" | grep -qi '"status":\s*"in_progress"\|"status":\s*"pending"' 2>/dev/null; then
    HAS_INCOMPLETE_SIGNALS=true
  fi

  if echo "$TAIL" | grep -qi '"is_error":\s*true' 2>/dev/null; then
    HAS_INCOMPLETE_SIGNALS=true
  fi

  if echo "$TAIL" | grep -q '\- \[ \]' 2>/dev/null; then
    HAS_INCOMPLETE_SIGNALS=true
  fi

  if [ "$STOP_HOOK_ACTIVE" = "true" ] && [ "$HAS_INCOMPLETE_SIGNALS" = false ]; then
    rm -f "$COUNTER_FILE"
    exit 0
  fi
fi

NEXT=$((COUNT + 1))
echo "$NEXT" > "$COUNTER_FILE"

if [ "$HAS_INCOMPLETE_SIGNALS" = true ]; then
  PREAMBLE="Incomplete tasks, unchecked boxes, or recent tool errors were detected."
else
  PREAMBLE="Verify the task is genuinely complete before stopping."
fi

if [ "$MAX" -gt 0 ]; then
  LABEL="AGENTIC_DEV (${NEXT}/${MAX})"
else
  LABEL="AGENTIC_DEV (${NEXT})"
fi

REASON="${LABEL}: ${PREAMBLE}

Before stopping, do each of these checks:

1. RE-READ THE ORIGINAL USER MESSAGE(S). List every discrete request, acceptance criterion, and constraint.
2. CHECK REPO POLICY. Confirm that repo-local instruction files and workflow rules were followed.
3. CHECK PLAN OR SPEC STATE. Any pending plan item, open checkbox, unresolved requirement, or unanswered blocker means you are not done.
4. CHECK REVIEW AND CI FOLLOW-UPS. If review comments, PR feedback, or failing checks were part of the task, confirm each one is resolved or explicitly called out.
5. CHECK VERIFICATION EVIDENCE. Do not claim fixed, passing, or complete without fresh evidence. If you did not run a needed verification, say so plainly instead of implying success.
6. CHECK GIT STATE AND CLEANUP. Confirm whether the branch, worktree, and staged changes are in the intended final state for this task.

IMPORTANT: If the user explicitly said to stop, defer work, skip verification, or leave integration steps for later, respect that instruction. Otherwise, continue working instead of narrating what remains."

jq -n --arg reason "$REASON" '{ decision: "block", reason: $reason }'
