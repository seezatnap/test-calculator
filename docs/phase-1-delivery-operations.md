# Phase 1 Delivery Operations

This document defines the Phase 1 operational flow for sprint execution and sign-off.

## Preflight checks

Run preflight before launching any sprint:

1. Branch alignment:
Verify expected source/target branches match actual branch values. Any mismatch is a blocking failure and triggers branch clarification.
2. Artifact validation:
Required artifacts (for example `tasks.md`, `specs.md`, PRD inputs) must exist and pass schema/content checks.
3. Run-input validation:
Required run inputs (for example email, sprint count, variation count, engine selection) must be present and valid.

Automation entry point: `runPreflightChecks` in `src/app/delivery-operations.ts`.

## Failure triage path

When preflight fails:

1. Halt on branch drift and request branch clarification from a human reviewer.
2. Repair missing/invalid artifacts.
3. Repair missing/invalid run-input values.
4. Re-run preflight.
5. If unresolved after retries or if explicit human flags exist, enforce human review.

Automation entry point: `buildFailureTriagePath` in `src/app/delivery-operations.ts`.

## Human-review decision gate

Human review is required when any of the following is true:

1. A branch alignment issue exists.
2. A preflight issue is marked as human-required.
3. Triage retry budget is exhausted (2 attempts).
4. End-of-sprint rubric outcome is not `pass`.

Automation entry point: `evaluateHumanReviewGate` in `src/app/delivery-operations.ts`.

## End-of-sprint rubric scoring

Score each category from 0-5, apply weighted scoring, then convert to a 0-100 percentage.

| Category | Weight |
| --- | --- |
| `preflightChecks` | 25% |
| `triagePath` | 20% |
| `humanGate` | 15% |
| `typedModuleBoundaries` | 25% |
| `validationAndTests` | 15% |

Outcome thresholds:

- `pass`: `>= 85%`
- `conditional`: `>= 70%` and `< 85%`
- `fail`: `< 70%`

Automation entry point: `scoreEndOfSprintRubric` in `src/app/delivery-operations.ts`.

## Typed module boundaries scaffolded in Phase 1

- `src/render/index.ts`: render interface boundary and frame contracts
- `src/engine/index.ts`: evaluator/reducer engine boundary
- `src/input/index.ts`: keyboard/pointer binding boundary
- `src/app/index.ts`: app composition boundary across render/engine/input
- Shared contracts:
- `src/contracts/state.ts`
- `src/contracts/actions.ts`
