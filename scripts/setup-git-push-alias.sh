#!/usr/bin/env sh
# Configures local alias so `git push` (even with --no-verify / -n) always runs the pre-push hook.
# Run automatically on npm/pnpm install via the prepare script.

# Skip in CI so workflow pushes and automation are not affected
if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; then
  exit 0
fi

git config --local alias.push '!scripts/git-push-no-skip.sh'
