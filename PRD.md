# PRD: Hostile Seating

## 1. Overview
A playful browser-based 3D physics laboratory for people who enjoy finding the wrong way to sit on furniture. Inspired by the irreverent physicality of Roman Roy in Succession, using original procedural characters, furniture and writing. The visitor composes a questionable pose, releases it under gravity, sees a measured result and shares the starting setup.

Built during the DevDay Exchange Community Hackathon, London, 1 November 2026. Submission deadline: 17:00 Europe/London. Working title and deployment: Hostile Seating, https://sit.thunkoid.com.

## 2. Goals
- Complete the choose → pose → simulate → verdict → reset/share journey without accounts or API keys.
- Produce visibly different physical outcomes for balanced and unsupported configurations.
- Run entirely in a desktop/mobile browser, with all runtime assets bundled.
- Keep builds running on Hetzner despite venue Wi-Fi interruptions; serve the finished app from Cloudflare.
- Publish source, setup instructions, credits and evidence of an actual Codex contribution.

## 3. User stories and acceptance criteria

### US-001: Enter the laboratory
As a visitor, I want a ready-to-use chair and mannequin so I can understand the experiment immediately.
- [ ] Initial scene shows original procedural furniture, a mannequin, floor and lighting.
- [ ] Camera can orbit/zoom; an obvious reset-view control is available.
- [ ] Loading, WebGL failure and runtime errors have visible UI.
- [ ] Typecheck passes.
- [ ] Verify in browser using dev-browser skill if available; otherwise Playwright.

### US-002: Compose a pose
As a visitor, I want presets and adjustments so I can try absurd sitting arrangements.
- [ ] Four named presets include an ordinary seated baseline and an unsupported perch.
- [ ] Lean, sideways offset, forward offset and rotation controls update the preview.
- [ ] Chair is required; couch and pedestal are secondary additions after the chair journey works.
- [ ] Controls are labelled and keyboard accessible.
- [ ] Typecheck passes.
- [ ] Verify in browser using dev-browser skill if available; otherwise Playwright.

### US-003: Release gravity
As a visitor, I want a real physics test so I can see whether my arrangement stays supported.
- [ ] Simulate starts a fresh fixed-step gravity/collision test lasting at most six simulated seconds.
- [ ] Editing is disabled during the test; camera remains usable.
- [ ] Results distinguish a supported body from a fall or unsupported configuration, using observed physics state.
- [ ] Reset restores the exact starting pose and clears the result.
- [ ] Repeated reset/simulate cycles do not accumulate bodies or break controls.
- [ ] Typecheck passes.
- [ ] Verify in browser using dev-browser skill if available; otherwise Playwright.

### US-004: Read and share the verdict
As a visitor, I want a funny result and a shareable setup so I can challenge someone else.
- [ ] Result includes supported/fallen/unsupported status, simulated duration and explicitly fictional Executive Presence score.
- [ ] Share URL includes version, furniture, preset and bounded numeric pose adjustments.
- [ ] Opening a copied link reconstructs its starting configuration; malformed parameters fall back safely.
- [ ] Clipboard failure leaves a selectable URL rather than losing the link.
- [ ] Typecheck passes.
- [ ] Verify in browser using dev-browser skill if available; otherwise Playwright.

### US-005: Ship and hand off
As the builder, I want a reproducible public project and durable remote workflow.
- [ ] Root README documents setup, checks, deployment, limitations, credits and remote-session recovery.
- [ ] Public GitHub repository and HTTPS demo open without login.
- [ ] Remote build/agent session is persistent, with log and checkpoint instructions.
- [ ] Record actual Codex task, changed files and verified outcome; never invent contribution evidence.
- [ ] A demo script fits within 90 seconds.

## 4. Functional requirements
FR-1: Render the scene using React Three Fiber and original Three.js primitives.
FR-2: Use Rapier gravity and contact simulation at a fixed 1/60-second timestep.
FR-3: Support pose presets and bounded lean/translation/yaw controls.
FR-4: Model furniture with collision shapes matching visible surfaces.
FR-5: Determine results from body height, orientation and ongoing furniture contact; never return a preset's hard-coded outcome.
FR-6: Limit tests to six simulated seconds, with early completion for a clear fall.
FR-7: Reset all physics state between trials.
FR-8: Encode only public pose state in share URLs, with validated parameters.
FR-9: Host built static assets, including physics WASM, on Cloudflare Workers at sit.thunkoid.com.
FR-10: Maintain git checkpoints and server-side logs for remote continuation.

## 5. Non-goals
An exhaustive search of every human pose; biomechanical/ergonomic accuracy; authenticated accounts; database; multiplayer; imported furniture; generative assets; medical advice; autonomous pose optimisation; reproducing an actor's likeness or using TV footage.

## 6. Design
An expensive-looking institutional laboratory with editorial typography, warm off-white surfaces, charcoal rules, rust-orange highlights and deadpan corporate copy. The scene is the dominant visual element. Controls form a compact side panel on desktop and stack below the scene on mobile. Keep the result legible outside the 3D canvas.

## 7. Technical approach and fallback
Vite, React 19, TypeScript, React Three Fiber 9, Rapier wrapper 2 and Drei. No runtime server or paid API is required. Static Cloudflare deployment is separate from Hetzner development.

Articulated motor-driven ragdolls are the biggest schedule risk. Timebox exploration to 30 minutes. The approved prototype fallback is a held-pose compound rigid body: limbs are posed visually and physically but remain rigid relative to one another during the balance test. Clearly label this in UI and README. This is a toy balance experiment, not a human muscular simulation. Furniture may remain fixed for this prototype. Measure outcomes honestly under the chosen model.

Sharing replays starting settings, not exact floating-point trajectories across devices. Avoid asserting deterministic results across machines. Bundle dependencies; do not load fonts, models or physics from third-party CDNs at runtime.

## 8. Success metrics / release checks
- A first-time visitor runs a test within 30 seconds.
- Baseline and clearly unsupported offset have different observed outcomes.
- Three consecutive reset/test cycles complete without console/page errors.
- Share-link round trip preserves every setting.
- Typecheck, production build and meaningful Playwright journey tests pass.
- Public demo is reachable by 16:15; feature freeze by 16:20; video and submission checks by 16:40, leaving 20 minutes buffer.

## 9. Delivery and credits
Build the chair journey first; add couch/pedestal only after it passes. Stop feature additions if the deadline buffer is threatened. README must credit React, Three.js, React Three Fiber, Drei, Rapier, Vite and Cloudflare; note all procedural art and identify any copied code/templates accurately. Use a GitHub noreply author address for new commits. Keep credentials, personal data and private SSH details out of tracked files and demo footage.

## 10. Operational checks
- Cloudflare deployment credentials and zone access verified; the custom domain is live.
- Remote Codex credentials verified through an actual scene implementation and an interactive tmux handoff.
- Deployed-domain browser checks passed for physics loading, simulation and shared links.
