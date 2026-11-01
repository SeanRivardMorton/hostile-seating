# Actual Codex contribution
## Physics scene contribution — 2026-11-01

Codex implemented `src/Scene.tsx` against the existing `SceneProps` contract. The scene owns its Canvas and uses original procedural mannequin/furniture geometry, warm studio lighting, a ground grid, contact shadows, orbit controls and camera reset. Chair, couch and pedestal have one fixed furniture body with box colliders matching their visible pieces.

The approved fallback is implemented: the mannequin is a **held-pose compound rigid body**, not independently articulated ragdoll limbs. Furniture remains fixed. This is a toy balance simulation rather than a biomechanical model; the coordinating UI/documentation agent should add the agreed product label.

Trials use Rapier gravity at a fixed 1/60-second timestep, a six-simulated-second limit, throttled progress and one completion callback. Verdicts observe actual furniture collider-pair contacts, persistent contact duration, pelvis height, orientation and body velocities. Ground-only foot contact cannot qualify. Configuration/trial changes recreate the physics world; an unfinished stop restores the held pose and clears velocities, forces, contact history and timers. Completed physical states stay visible. Preview placement avoids furniture interpenetration, with the ordinary seated pelvis starting at 1.4 m and settling near 1.34 m above the floor.

Checks actually performed:

- Read PRD.md, AGENTS.md and src/model.ts; checked current upstream React Three Rapier documentation and installed API declarations.
- `pnpm typecheck`: initial run failed because `three-stdlib` was not directly available as a type import. Replaced that import with React's inferred component-ref type. Subsequent runs passed, including the final scene revision.
- A temporary direct Rapier harness outside the repository used the scene's actual pose/furniture/placement functions and matching colliders. Three fresh chair baselines returned supported at six seconds; the 1.8 m sideways offset fell at approximately 0.533 seconds. Couch and pedestal baselines returned supported at six seconds. This check also caught and corrected the original shin/seat overlap.
- A temporary Playwright browser harness outside the repository rendered the real Scene component. Baseline: supported at six seconds; 1.8 m sideways offset: fallen at approximately 0.533 seconds; reset to baseline: supported; repeat reset/test: supported. The successful four-case run reported no page or console errors.
- Browser setup first failed because no Playwright browser was installed, then because Chromium lacked host shared libraries. Downloaded Chromium and extracted required libraries into the external temporary harness, without installing system packages. An intermediate browser run was interrupted by a harness HTML reload; its replacement completed all four cases.
- Inspected browser screenshots and corrected a contact-shadow background artifact by enabling renderer alpha. A subsequent browser run of the final scene again returned supported at six seconds, with no page/console errors.
- The external Vite harness production build passed; it warned about bundle chunk size. The repository's integrated `pnpm build` and `pnpm test` were not run because the concurrent application UI was not yet present. URL round-trip and integrated UI/error states remain the coordinator's checks.

Only Scene.tsx and this explicitly requested contribution entry were changed in the repository. No commit or deployment was performed. PROGRESS.md was left for the coordinator because this task explicitly restricted documentation edits to CODEX.md; the coordinator should append the above initial check failures and successful reruns there.

## Integration verification by the coordinating agent

The delivered scene was imported into the complete app. `pnpm build` passed, and all three Playwright journey tests passed locally and against https://sit.thunkoid.com. The integrated checks cover baseline support, a real unsupported fall, repeated reset/test cycles, share-link reconstruction, malformed URL parameters and mobile layout. A 49.88-second captioned video was recorded from actual public-site interactions with no browser errors.
