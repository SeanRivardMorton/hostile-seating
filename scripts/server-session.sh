#!/usr/bin/env bash
set -euo pipefail

# Launch inside tmux, from the project root. Authentication lives outside git.
export PATH="$HOME/.local/node_modules/.bin:$HOME/.local/bin:$PATH"
export GIT_AUTHOR_NAME=SeanRivardMorton
export GIT_AUTHOR_EMAIL=15823313+SeanRivardMorton@users.noreply.github.com
export GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME"
export GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"

if [[ -f "$HOME/.ssh/hostile_seating_github" ]]; then
  export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/hostile_seating_github -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$HOME/.ssh/hostile_seating_known_hosts"
fi
if [[ -d "$HOME/hostile-scene-check/libs/usr/lib/x86_64-linux-gnu" ]]; then
  export LD_LIBRARY_PATH="$HOME/hostile-scene-check/libs/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi

# This server denies user namespaces; use the trusted non-root project session.
exec codex --sandbox danger-full-access -C "$PWD" \
  'Read PRD.md, AGENTS.md, PROGRESS.md and CODEX.md. The implemented prototype is live at https://sit.thunkoid.com and its source is public. Report readiness briefly and then await the operator. Do not edit files, launch extra work, commit, push or redeploy on startup. For subsequent operator requests, work only in this repository, verify changes, keep PROGRESS.md current, and commit/push only when requested. The server has a repo-specific write deploy key; use git push git@github.com:SeanRivardMorton/hostile-seating.git HEAD:main when a push is requested. Cloudflare deployment is currently authenticated on the coordinating laptop, not on this server. Never claim server-side deployment access unless you have verified it.'
