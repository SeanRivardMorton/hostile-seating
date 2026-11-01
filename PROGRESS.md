# Build progress

## 2026-11-01 — Initial handoff
- Created root PRD, agent instructions and a new public repository during the hackathon.
- Confirmed Hetzner SSH connectivity and Node/pnpm/tmux availability.
- Installed Codex CLI on the server; provisioned API-key authentication via encrypted SSH stdin, outside the repository.
- Initial launch used an obsolete CLI flag and exited before making changes. Checked current Codex docs and CLI help; relaunched using `--sandbox workspace-write`.
- Confirmed local Cloudflare OAuth access. Deployment is not yet complete.
- Coordinating agent is implementing UI, sharing, tests and deployment while remote Codex owns the physics scene.
- Workspace sandbox launches failed because the server denies user-namespace creation. The bounded task was restarted under the non-root server account without the unavailable OS sandbox; project edit boundaries remain in the prompt. No server namespace/security settings were changed.

## 2026-11-01 — Physics and integration verified
- Remote Codex implemented Scene.tsx and recorded its real work in CODEX.md. Initial type import and browser dependency problems were corrected; temporary browser libraries were extracted outside the repository without changing system packages.
- Local `pnpm build` passed; its large scene-bundle warning reflects bundled Three.js and physics code (about 1.09 MB gzipped), rather than external runtime asset requests.
- Local Playwright suite: all three tests passed, covering supported baseline, unsupported fall, repeated reset, sharing, validation and mobile layout.
- Deployed a dedicated Worker and custom domain through existing Cloudflare authentication.
- First domain check briefly received Cloudflare 1104 during initial route propagation. Subsequent HTTP checks returned 200; the entire deployed-domain browser suite then passed (three tests, 20.7 seconds).
- The remote server has a repository-specific write deploy key; it cannot access other GitHub repositories through that key.
- Recorded a real public-site demo with presentation captions and no page errors. FFprobe measured 49.88 seconds; the encoded MP4 is approximately 727 KB. Preview screenshot contains only the app.
- Synced the verified release to Hetzner, preserving the original agent output in a named git stash. The complete production build and all three browser tests passed there (36.7 seconds).
- GitHub Actions completed successfully: dependency installation, typecheck, production build and browser suite.
- Provisioned Cloudflare authentication on Hetzner in a dedicated user configuration directory outside git (credential file mode 0600); verified account access. Server-session.sh selects that directory for future agent deployments.
- Successfully redeployed the identical verified release directly from Hetzner. Public MP4 playback was checked in a fresh Chromium context: 49.88 seconds, 1280×900, no media error.
- The preview initially selected port 4174 because the test server was still using 4173. Restarted the preview on loopback port 4173 with strict port selection after the tests completed.
