#!/usr/bin/env bash
# PreToolUse guard (runbook section 3.3): block automated edits to .env*,
# lockfiles and .git/. Exit code 2 blocks the tool call.
# Uses jq when present, otherwise Node (jq is not installed on every machine).
# If the input cannot be parsed, the edit is blocked (fail closed).
set -uo pipefail
INPUT=$(cat)

if command -v jq >/dev/null 2>&1; then
  FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty') || {
    echo "Blocked: protect-secrets hook could not parse its input." >&2; exit 2; }
else
  FILE_PATH=$(printf '%s' "$INPUT" | node -e '
    let s = "";
    process.stdin.on("data", d => (s += d)).on("end", () => {
      try {
        const t = JSON.parse(s).tool_input || {};
        process.stdout.write(String(t.file_path || t.notebook_path || ""));
      } catch { process.exit(3); }
    });') || { echo "Blocked: protect-secrets hook could not parse its input." >&2; exit 2; }
fi

FILE_PATH="${FILE_PATH//\\//}"

PROTECTED=(".env" ".env.local" ".env.production" "package-lock.json" "pnpm-lock.yaml" ".git/")
for pattern in "${PROTECTED[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "Blocked: $FILE_PATH matches protected pattern '$pattern'. Request explicit human intervention." >&2
    exit 2
  fi
done
exit 0
