#!/usr/bin/env bash
# =============================================================================
# scripts/e2e-docker.sh — Orchestrates the quorum-dash browser E2E Docker run.
#
# Requires the quorum backend E2E stack running at quorum-e2e_e2e Docker network.
# This script handles starting both stacks in the correct order.
#
# Usage:
#   ./scripts/e2e-docker.sh [up|run|down|clean|full]
#
#   up    — Start quorum backend, build + start dashboard; wait until healthy
#   run   — Run browser-test-runner (exits with Playwright's exit code)
#   down  — Stop dashboard compose + quorum backend
#   clean — Stop + wipe all volumes (fresh state for both stacks)
#   full  — up → run → down (CI-friendly, returns Playwright exit code)
#
# Extra args after 'run' are forwarded to the test runner:
#   ./scripts/e2e-docker.sh run npx playwright test --grep "S-14"
#
# Requirements:
#   Docker Desktop >= 4.0 (Compose v2.1+)
#   quorum/ must be checked out at ../quorum (sibling of quorum-dash/)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
QUORUM_ROOT="$(cd "$PROJECT_ROOT/../quorum" && pwd)"

COMPOSE="docker compose -f $PROJECT_ROOT/docker-compose.e2e.yml"
QUORUM_COMPOSE="docker compose -f $QUORUM_ROOT/docker-compose.e2e.yml"

_up() {
  echo "▶ [UI-E2E] Starting quorum backend stack (gateway + deps)..."
  $QUORUM_COMPOSE build
  $QUORUM_COMPOSE up -d --wait gateway
  echo "✓ [UI-E2E] Gateway healthy — backend network quorum-e2e_e2e is live"

  echo ""
  echo "▶ [UI-E2E] Building + starting dashboard..."
  $COMPOSE build dashboard
  $COMPOSE up -d --wait dashboard
  echo "✓ [UI-E2E] Dashboard healthy — ready at http://dashboard:8080 (internal)"
}

_run() {
  echo "▶ [UI-E2E] Running browser tests inside Docker..."
  # --rm removes the container after the run (and its anonymous volumes).
  # The browser-test-runner image has node_modules compiled for Alpine.
  $COMPOSE run --rm browser-test-runner "$@"
}

_down() {
  echo "▶ [UI-E2E] Stopping dashboard environment..."
  $COMPOSE down 2>/dev/null || true

  echo "▶ [UI-E2E] Stopping quorum backend stack..."
  $QUORUM_COMPOSE down 2>/dev/null || true

  echo "✓ [UI-E2E] All containers stopped and removed"
}

_clean() {
  echo "▶ [UI-E2E] Cleaning all environments (containers + volumes)..."
  $COMPOSE down --volumes --rmi local 2>/dev/null \
    || $COMPOSE down --volumes 2>/dev/null || true
  $QUORUM_COMPOSE down --volumes --rmi local 2>/dev/null \
    || $QUORUM_COMPOSE down --volumes 2>/dev/null || true
  echo "✓ [UI-E2E] All containers, volumes, and local images removed"
}

case "${1:-full}" in
  up)
    _up
    ;;

  run)
    shift || true
    _run "$@"
    ;;

  down)
    _down
    ;;

  clean)
    _clean
    ;;

  full)
    # CI-friendly: start everything, run tests, tear down regardless of outcome.
    _up

    echo ""
    set +e   # don't abort on test failure — we still need to tear down
    _run
    exit_code=$?
    set -e

    echo ""
    _down

    echo ""
    if [[ $exit_code -eq 0 ]]; then
      echo "✓ [UI-E2E] Browser tests passed (exit 0)"
    else
      echo "✗ [UI-E2E] Browser tests failed (exit $exit_code)"
    fi
    exit $exit_code
    ;;

  *)
    cat <<'USAGE'
Usage: e2e-docker.sh [up|run|down|clean|full]

  up    — Start quorum backend + dashboard; wait until healthy
  run   — Run browser tests against running stack (exits with Playwright code)
  down  — Stop dashboard + quorum backend containers
  clean — Stop containers AND remove all volumes (fresh state)
  full  — CI-friendly: up → run → down (default when no arg given)

Extra args after 'run' are passed directly to the browser test runner:
  ./scripts/e2e-docker.sh run npx playwright test --grep "S-14"

Note: quorum/ must be at ../quorum (sibling directory).
USAGE
    exit 1
    ;;
esac
