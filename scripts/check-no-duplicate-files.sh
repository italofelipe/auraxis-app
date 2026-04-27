#!/usr/bin/env bash
# check-no-duplicate-files.sh
#
# Pre-commit guard: rejects commits that stage any file matching the
# macOS Finder / iCloud "duplicate" pattern.
#   <name> <digit>.<ext>     (files)
#   <name> <digit>/          (directories)
#
# These artifacts are never intentional and break Expo's bundler
# auto-discovery when committed.

set -euo pipefail

mapfile -t STAGED < <(git diff --cached --name-only --diff-filter=ACMR)

if [[ ${#STAGED[@]} -eq 0 ]]; then
  exit 0
fi

OFFENDERS=()
for path in "${STAGED[@]}"; do
  if [[ "$path" =~ \ [0-9]+(\.[a-zA-Z0-9]+)?(/|$) ]]; then
    OFFENDERS+=("$path")
  fi
done

if [[ ${#OFFENDERS[@]} -gt 0 ]]; then
  echo "✖ Refusing to commit duplicate-pattern paths (macOS Finder / iCloud artifacts):" >&2
  printf '  %s\n' "${OFFENDERS[@]}" >&2
  echo >&2
  echo "Run 'bash scripts/clean-duplicate-files.sh' to remove them, then re-stage." >&2
  exit 1
fi

exit 0
