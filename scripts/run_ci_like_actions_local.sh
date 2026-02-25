#!/usr/bin/env bash
set -euo pipefail

# Run a local gate bundle that mirrors GitHub Actions CI as closely as possible.
#
# Default: Dockerized Node 22 environment for parity with ubuntu-latest jobs.
# Flags:
#   --local             Run in current shell environment
#   --with-expo-bundle  Include expo JS bundle check (requires EXPO_TOKEN)
#   --with-sonar        Include local sonar-scanner run (requires scanner + token)
#   --help              Show usage

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

MODE="docker"
RUN_EXPO_BUNDLE=0
RUN_SONAR=0

usage() {
  cat <<'USAGE'
Usage: bash scripts/run_ci_like_actions_local.sh [options]

Options:
  --local             Run checks in the current environment
  --with-expo-bundle  Include Expo JS bundle check (android export)
  --with-sonar        Include sonar-scanner execution
  --help              Show this help

Examples:
  bash scripts/run_ci_like_actions_local.sh
  bash scripts/run_ci_like_actions_local.sh --local
  bash scripts/run_ci_like_actions_local.sh --local --with-expo-bundle
USAGE
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[ci-like-local] missing required command: $cmd" >&2
    exit 3
  fi
}

run_core_pipeline() {
  echo "[ci-like-local] step=install:npm-ci"
  npm ci --ignore-scripts

  echo "[ci-like-local] step=lint"
  npm run lint -- --max-warnings 0

  echo "[ci-like-local] step=typecheck"
  npm run typecheck

  echo "[ci-like-local] step=test:coverage"
  npm run test:coverage

  echo "[ci-like-local] step=flags:hygiene"
  npm run flags:check

  echo "[ci-like-local] step=audit-gate"
  node scripts/ci-audit-gate.js

  if [[ "$RUN_EXPO_BUNDLE" -eq 1 ]]; then
    if [[ -z "${EXPO_TOKEN:-}" ]]; then
      echo "[ci-like-local] EXPO_TOKEN is required for --with-expo-bundle" >&2
      exit 4
    fi

    echo "[ci-like-local] step=expo-bundle"
    npx expo export --platform android --output-dir dist-android
  else
    echo "[ci-like-local] step=expo-bundle skipped (use --with-expo-bundle)"
  fi

  if [[ "$RUN_SONAR" -eq 1 ]]; then
    require_command sonar-scanner

    if [[ -z "${SONAR_AURAXIS_APP_TOKEN:-}" ]]; then
      echo "[ci-like-local] SONAR_AURAXIS_APP_TOKEN is required for --with-sonar" >&2
      exit 4
    fi

    echo "[ci-like-local] step=sonar"
    SONAR_TOKEN="$SONAR_AURAXIS_APP_TOKEN" sonar-scanner
  else
    echo "[ci-like-local] step=sonar skipped (use --with-sonar)"
  fi

  echo "[ci-like-local] all selected checks passed (local mode)."
}

run_in_docker() {
  require_command docker

  local args=("--local")
  if [[ "$RUN_EXPO_BUNDLE" -eq 1 ]]; then
    args+=("--with-expo-bundle")
  fi
  if [[ "$RUN_SONAR" -eq 1 ]]; then
    args+=("--with-sonar")
  fi

  echo "[ci-like-local] running in node:22-bookworm container..."
  docker run --rm \
    -v "$ROOT_DIR:/workspace" \
    -w /workspace \
    -e EXPO_TOKEN="${EXPO_TOKEN:-}" \
    -e SONAR_AURAXIS_APP_TOKEN="${SONAR_AURAXIS_APP_TOKEN:-}" \
    node:22-bookworm \
    bash -lc "bash scripts/run_ci_like_actions_local.sh ${args[*]}"

  echo "[ci-like-local] all selected checks passed (docker mode)."
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --local)
      MODE="local"
      shift
      ;;
    --with-expo-bundle)
      RUN_EXPO_BUNDLE=1
      shift
      ;;
    --with-sonar)
      RUN_SONAR=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [[ "$MODE" == "docker" ]]; then
  run_in_docker
else
  run_core_pipeline
fi
