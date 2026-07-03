#!/usr/bin/env bash
# Blocks push if secrets, build output, or other local-only paths are tracked or staged.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

fail() {
  echo -e "${RED}✗ $1${NC}" >&2
  exit 1
}

ok() {
  echo -e "${GREEN}✓ $1${NC}"
}

is_blocked_path() {
  case "$1" in
    .env.example) return 1 ;;
    .env) return 0 ;;
    ASSET_HOSTING.md) return 0 ;;
    .dev.vars) return 0 ;;
    dist/*) return 0 ;;
    node_modules/*) return 0 ;;
    .wrangler/*) return 0 ;;
    .vercel/*) return 0 ;;
  esac
  case "$1" in
    .env.*) return 0 ;;
  esac
  return 1
}

check_list() {
  local label="$1"
  local found=0
  local path
  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    if is_blocked_path "$path"; then
      if [[ $found -eq 0 ]]; then
        echo -e "${RED}✗ Unsafe paths ${label}:${NC}" >&2
        found=1
      fi
      echo "  $path" >&2
    fi
  done
  return $found
}

errors=0
git ls-files 2>/dev/null | check_list "tracked in git" || errors=1
# Add/modify/copy/rename only — staged deletions of blocked paths are intentional
git diff --cached --name-only --diff-filter=ACMR 2>/dev/null | check_list "staged for commit" || errors=1

if [[ $errors -ne 0 ]]; then
  echo >&2
  echo "Remove these from git (keep local only):" >&2
  echo "  git rm --cached <path>   # if already committed" >&2
  echo "  git reset HEAD <path>    # if only staged" >&2
  fail "Push blocked — fix the paths above."
fi

if [[ -f .env ]] && ! git check-ignore -q .env 2>/dev/null; then
  fail ".env exists but is not listed in .gitignore"
fi

if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  fail ".env is tracked by git — run: git rm --cached .env"
fi

if git ls-files --error-unmatch ASSET_HOSTING.md >/dev/null 2>&1; then
  fail "ASSET_HOSTING.md is tracked — run: git rm --cached ASSET_HOSTING.md"
fi

ok "No secrets or local-only paths tracked or staged"
ok ".env is not in the index"
