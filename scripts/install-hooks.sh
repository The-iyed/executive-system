#!/usr/bin/env sh
# Installs this repo's hooks into .git/hooks so they run with Git's default config.
# No Node/pnpm required. Run once after clone so pre-push and post-merge run even if you never run "pnpm install".
#
# Usage: ./scripts/install-hooks.sh   (from repo root, or any dir inside the repo)

set -e

# Skip in CI
if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; then
  exit 0
fi

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

HOOKS_DIR="$ROOT/.husky"
GIT_HOOKS="$ROOT/.git/hooks"

for hook in pre-push post-merge; do
  if [ -f "$HOOKS_DIR/$hook" ]; then
    cp "$HOOKS_DIR/$hook" "$GIT_HOOKS/$hook"
    chmod +x "$GIT_HOOKS/$hook"
  fi
done

# Push alias so --no-verify cannot skip pre-push
sh "$ROOT/scripts/setup-git-push-alias.sh"

echo "Hooks installed to .git/hooks (pre-push, post-merge). You can push and pull as usual."
