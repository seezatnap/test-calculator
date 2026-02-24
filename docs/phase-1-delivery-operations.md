# Phase 1 Delivery Operations Runbook

This runbook defines task #1 delivery operations for Phase 1 (`WebGL Foundation`) and the typed module boundary scaffold used by downstream implementation tasks.

## 1. Preflight checks before coding

Run these checks before starting implementation work:

1. Branch alignment check
   - Confirm current branch matches the assigned agent branch.
   - Confirm target sprint branch exists and matches the current run hash.
   - If branch drift or mismatch is detected, stop work and request branch clarification.
2. Artifact and run-input validation
   - Validate that required artifacts are present and non-empty:
     - `.swarm-hug/phase-1-webgl-foundation/prompt.md`
     - `.swarm-hug/phase-1-webgl-foundation/specs.md`
     - `.swarm-hug/phase-1-webgl-foundation/tasks.md`
     - `prds/phase-1-webgl-foundation-prd.md`
   - Validate that run-input references point to the same phase and branch context.
3. Preflight pass criteria
   - No branch errors.
   - No missing artifacts.
   - No missing run-input declarations.

Reference implementation: `src/app/delivery-operations.ts` -> `runPreflightChecks(...)`.

## 2. Failure triage path

Use the failure kind to choose a deterministic triage path:

1. `branch_mismatch`
   - Immediate stop.
   - Escalate to human reviewer for branch clarification.
   - Resume only after explicit alignment confirmation.
2. `artifact_validation_failed`
   - Agent repairs missing/invalid artifact input.
   - Re-run preflight.
3. `validation_gate_failed`
   - Agent fixes the smallest failing lint/typecheck/build/test issue.
   - Re-run full validation gate.
4. `review_gate_blocked` or `rubric_below_threshold`
   - Escalate to human reviewer/sprint lead for decision.

Reference implementation: `src/app/delivery-operations.ts` -> `buildFailureTriagePath(...)`.

## 3. Human-review decision gate

Human review is required when any of these are true:

1. Preflight failed.
2. Branch drift was detected.
3. Spec ambiguity exists.
4. Unresolved failures remain.
5. Rubric score is below threshold (`85`).

Gate output is explicit: `continue` or `request-human-review`.

Reference implementation: `src/app/delivery-operations.ts` -> `evaluateHumanReviewDecisionGate(...)`.

## 4. End-of-sprint rubric scoring

Use weighted 0-5 category scores:

1. `preflightOperations` (20%)
2. `triageReadiness` (20%)
3. `moduleContracts` (25%)
4. `validationEvidence` (20%)
5. `handoffQuality` (15%)

Rules:

1. Weights must total `100`.
2. Each category score must be in `[0, 5]`.
3. Banding:
   - `excellent`: `>= 90`
   - `pass`: `>= 75`
   - `needs-work`: `< 75`
4. Winner eligibility requires:
   - weighted score `>= 85`
   - no category below `4`

Reference implementation: `src/app/delivery-operations.ts` -> `scoreSprintRubric(...)`.

## 5. Strongly typed module boundaries (scaffold)

The Phase 1 scaffold establishes strict module boundaries with shared contracts:

1. `src/contracts/`
   - Shared `AppState` contract, history/preference model, and `AppAction` union.
2. `src/render/`
   - Renderer boundary exposes `preflight`, frame rendering, and `dispose` lifecycle.
   - Renderer consumes read-only state and emits actions; it does not mutate state directly.
3. `src/engine/`
   - Engine boundary exposes deterministic `reduce` and `evaluate` contracts.
   - Reducer is the only state transition owner.
4. `src/input/`
   - Input boundary translates keyboard/pointer signals into typed actions.
5. `src/app/`
   - App boundary composes render + engine + input modules and controls dispatch flow.

This boundary split is intentionally minimal so tasks #2+ can implement rendering/evaluation features without changing core contracts.
