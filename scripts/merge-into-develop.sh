#!/usr/bin/env bash

set -euo pipefail

TARGET_BRANCH="develop"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/apps/backend"

log() {
  printf '[merge-helper] %s\n' "$1"
}

fail() {
  printf '[merge-helper] Error: %s\n' "$1" >&2
  exit 1
}

require_git_repo() {
  git -C "$PROJECT_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1 || \
    fail "This script must run inside the TripBazarBD Git repository."
}

current_branch() {
  git -C "$PROJECT_ROOT" branch --show-current
}

require_supported_source_branch() {
  local branch="$1"

  if [[ -z "$branch" ]]; then
    fail "Could not detect the current branch."
  fi

  case "$branch" in
    "$TARGET_BRANCH")
      fail "Already on '$TARGET_BRANCH'. Run the helper from a task branch."
      ;;
    main)
      fail "Refusing to merge from 'main'. Use a normal task branch instead."
      ;;
    feature/*|fix/*|docs/*|chore/*)
      ;;
    *)
      fail "Unsupported source branch '$branch'. Use feature/, fix/, docs/, or chore/ branches."
      ;;
  esac
}

require_clean_worktree() {
  if [[ -n "$(git -C "$PROJECT_ROOT" status --short)" ]]; then
    fail "Working tree is not clean. Commit or stash your changes before running the helper."
  fi
}

run_validation() {
  if [[ ! -f "$BACKEND_DIR/package.json" ]]; then
    log "No backend package.json found. Validation was not auto-run."
    return 0
  fi

  if ! command -v npm >/dev/null 2>&1; then
    log "npm is not installed. Validation was not auto-run."
    return 0
  fi

  log "Running backend validation: npm test"
  (
    cd "$BACKEND_DIR"
    npm test
  )

  log "Running backend validation: npm run build"
  (
    cd "$BACKEND_DIR"
    npm run build
  )
}

confirm_push() {
  local response

  printf "Push '%s' to origin now? [y/N]: " "$TARGET_BRANCH"
  read -r response

  case "$response" in
    y|Y|yes|YES)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

main() {
  require_git_repo
  require_clean_worktree

  local source_branch
  source_branch="$(current_branch)"

  require_supported_source_branch "$source_branch"

  log "Source branch: $source_branch"
  log "Target branch: $TARGET_BRANCH"

  log "Checking out '$TARGET_BRANCH'"
  git -C "$PROJECT_ROOT" checkout "$TARGET_BRANCH"

  log "Pulling latest '$TARGET_BRANCH' from origin"
  git -C "$PROJECT_ROOT" pull origin "$TARGET_BRANCH"

  log "Merging '$source_branch' into '$TARGET_BRANCH'"
  if ! git -C "$PROJECT_ROOT" merge --no-ff "$source_branch"; then
    printf '\n'
    log "Merge conflict detected. Resolve the conflicts on '$TARGET_BRANCH', then continue manually."
    log "Helpful commands:"
    log "  git status"
    log "  git add <resolved-files>"
    log "  git commit"
    log "  npm test   # if needed"
    log "  git push origin $TARGET_BRANCH"
    exit 1
  fi

  run_validation

  if confirm_push; then
    log "Pushing '$TARGET_BRANCH' to origin"
    git -C "$PROJECT_ROOT" push origin "$TARGET_BRANCH"
    log "Merge and push completed successfully."
  else
    log "Push skipped. '$TARGET_BRANCH' has been updated locally only."
    log "Run 'git push origin $TARGET_BRANCH' when you are ready."
  fi
}

main "$@"
