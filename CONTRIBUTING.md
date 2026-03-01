# Contributing

## Setup (required once after clone)

So that pre-push (Docker check) and post-merge run, do **one** of the following after cloning:

1. **`pnpm install`** (or `npm install`) – installs deps and installs hooks.
2. **`./scripts/install-hooks.sh`** – installs hooks only (no Node/pnpm needed). Use this if you don’t run install yet.

Until you run one of these, Git won’t run this repo’s hooks and you could push without the Docker build check.

## Pre-push checks

Before every push, Husky runs a **Docker Compose build and startup** check so no one pushes code that would break the Docker build.

- **`--no-verify` / `-n` cannot be used to skip it.** This repo configures a local Git alias for `git push` that strips those flags and always runs the real push (so the pre-push hook runs). The alias is installed automatically when you run `npm install` or `pnpm install` (`prepare` script).
- If the Docker build fails locally, fix it (run `docker compose up --build` and fix errors) before pushing.
- CI also runs the same check ([Docker build workflow](.github/workflows/docker-build.yml)); branch protection can require it to pass before merging.
