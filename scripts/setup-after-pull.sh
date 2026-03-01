#!/usr/bin/env sh
# Run husky + push alias setup once after the first git pull. Subsequent pulls skip this so pull stays fast.
# Note: This only runs when Git's core.hooksPath is already .husky (i.e. after "pnpm install" / prepare has been run at least once).

# Skip in CI
if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; then
  exit 0
fi

# Already ran once in this clone
if [ -f .git/husky-setup-done ]; then
  exit 0
fi

# Run from repo root
cd "$(git rev-parse --show-toplevel)" || exit 0

# Refresh .git/hooks from .husky and set push alias (so hooks work and stay in sync after pull)
sh scripts/install-hooks.sh 2>/dev/null || true

touch .git/husky-setup-done
