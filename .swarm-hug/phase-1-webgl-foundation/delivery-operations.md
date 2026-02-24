# Phase 1 Delivery Operations

This runbook defines the Phase 1 delivery flow for `Phase1WebGLFoundation` and mirrors the operational requirements from:
- `.morgan/source-files/01-phase1webglfoundation-instructions.md`
- `.morgan/scientific-calculator.julietscript`
- `prds/phase-1-webgl-foundation-prd.md`

## 1) Preflight checks

Preflight must pass before any sprint run starts.

1. Branch alignment:
   - Confirm active branch matches the planned sprint/agent branch.
   - Confirm source/target intent remains `main -> feature/phase-1-webgl-foundation`.
   - On mismatch: stop and request branch clarification.
2. Artifact validation:
   - Confirm required artifacts exist and are readable:
     - `.morgan/source-files/01-phase1webglfoundation-instructions.md`
     - `prds/phase-1-webgl-foundation-prd.md`
   - On missing artifact: stop and repair path/input mapping.
3. Run-input validation:
   - Validate required run inputs are explicit and non-empty.
   - Minimum required keys:
     - `artifact` (expected `Phase1WebGLFoundation`)
     - `sourceBranch`
     - `targetBranch`
   - On invalid run input: stop and request corrected input values.

Typed implementation: `src/app/delivery-ops.ts#runPreflightChecks`.

## 2) Failure triage path

Every failed run follows the same deterministic triage:

1. Capture context:
   - failing command
   - short error
   - probable root cause
   - current branch
   - log path
2. Attempt one safe recovery if none has been attempted yet.
3. Route outcome:
   - recovery not attempted -> `attempt-safe-recovery`
   - recovery succeeded -> `retry-command`
   - recovery failed -> `request-human-review`

Typed implementation: `src/app/delivery-ops.ts#triageFailure`.

## 3) Human-review decision gate

Human review is mandatory when any of the following is true:

1. branch drift (`branch-alignment` failed)
2. artifact mismatch (`artifact-validation` failed)
3. invalid run inputs (`run-input-validation` failed)
4. safe recovery failed (`triage.nextStep === request-human-review`)

Typed implementation: `src/app/delivery-ops.ts#evaluateHumanReviewGate`.

## 4) End-of-sprint rubric scoring

Use `DeliveryRubric` weights from JulietScript:

1. Correctness: `0..5`
2. Safety: `0..3`
3. Traceability: `0..2`

Scoring:

1. Clamp each criterion to its max.
2. Total score = correctness + safety + traceability (`maxTotal=10`).
3. Pass threshold (Phase 1 assumption): `total >= 8`, `correctness >= 4`, `safety >= 2`.
4. Tie-break order for winner selection:
   - higher total
   - higher correctness
   - higher safety
   - higher traceability

Typed implementation:
- `src/app/delivery-ops.ts#scoreDeliveryRubric`
- `src/app/delivery-ops.ts#compareDeliveryScores`

## 5) Strongly typed module boundaries

Phase 1 scaffolding introduces strict module seams with shared contracts:

1. Shared contracts:
   - `src/contracts/state.ts`
   - `src/contracts/actions.ts`
2. Module boundaries:
   - `src/render/boundary.ts`
   - `src/engine/boundary.ts`
   - `src/input/boundary.ts`
   - `src/app/boundary.ts`
3. App bootstrap scaffold:
   - `src/app/state.ts`
   - `src/app/boundary.ts#createAppRuntime`

Validation coverage:

1. `tests/delivery-ops.test.mjs` validates preflight/triage/review/rubric behavior.
2. `tests/app-boundaries.test.mjs` validates runtime wiring across render/engine/input/app boundaries.
