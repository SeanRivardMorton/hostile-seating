#!/usr/bin/env bash
set -euo pipefail

# Run from the repository root after inspecting your changes.
git status --short
git diff --check
git diff --stat
git log --oneline -10
pnpm typecheck
pnpm build
pnpm test

# Stage intended files explicitly, then commit using a public noreply identity:
# GIT_AUTHOR_NAME=SeanRivardMorton \
# GIT_AUTHOR_EMAIL=15823313+SeanRivardMorton@users.noreply.github.com \
# GIT_COMMITTER_NAME=SeanRivardMorton \
# GIT_COMMITTER_EMAIL=15823313+SeanRivardMorton@users.noreply.github.com \
# git commit -m "feat: describe the verified change"
# Push via the server's repository-scoped deploy key (see local server handoff).
