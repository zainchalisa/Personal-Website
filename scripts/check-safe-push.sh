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
    tripdog.project.json) return 0 ;;
    .dev.vars) return 0 ;;
    dist/*) return 0 ;;
    node_modules/*) return 0 ;;
    .wrangler/*) return 0 ;;
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
git diff --cached --name-only 2>/dev/null | check_list "staged for commit" || errors=1

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

if git ls-files --error-unmatch tripdog.project.json >/dev/null 2>&1; then
  fail "tripdog.project.json is tracked — run: git rm --cached tripdog.project.json"
fi

if [[ -f .env ]] && grep -qE '^VITE_.*TRIPDOG|^VITE_TRIPDOG' .env 2>/dev/null; then
  fail ".env uses VITE_ for Trip Dog — use TRIPDOG_PASSWORD / TRIPDOG_PROJECT_JSON without VITE_"
fi

ok "No secrets or local-only paths tracked or staged"
ok ".env and tripdog.project.json are not in the index"
