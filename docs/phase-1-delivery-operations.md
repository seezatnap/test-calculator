# Phase 1 Delivery Operations

## Purpose
This runbook defines the operational flow for Phase 1 (`phase-1-webgl-foundation`) delivery and review.

## 1. Preflight Checks
All preflight checks must pass before coding starts.

### Branch Alignment
1. Resolve repository context: main repo path, current worktree, current branch, sprint branch.
2. Verify current branch equals assigned agent branch.
3. Verify sprint branch naming matches run suffix and active sprint context.
4. Verify no unknown local drift (`git status --short --branch`).
5. If branch alignment fails, stop work and request branch clarification.

### Artifact and Run-Input Validation
Required artifacts:
- `.swarm-hug/phase-1-webgl-foundation/prompt.md`
- `.swarm-hug/phase-1-webgl-foundation/specs.md`
- `.swarm-hug/phase-1-webgl-foundation/tasks.md`
- `.morgan/source-files/01-phase1webglfoundation-instructions.md`
- `prds/phase-1-webgl-foundation-prd.md`

Required run inputs:
- assigned task id (`#1`)
- agent identity (`Aaron`)
- target branch/sprint branch identifiers

Validation rules:
1. Every required file exists.
2. Every required file is non-empty.
3. Task id and branch identifiers are explicit and non-empty.
4. If any artifact or run input fails validation, stop and open triage with failing items.

## 2. Failure Triage Path
When any command fails:
1. Capture the failing command and short error summary.
2. Classify probable root cause:
- branch drift/mismatch
- missing or invalid artifacts/run inputs
- build/test/typecheck regression
- environment/tooling issue
3. Attempt one safe recovery.
4. Re-run the failing command.
5. If recovery fails, request human review with:
- current branch and sprint branch
- failing command and concise log excerpt
- recovery attempt and result
- probable root cause and next recommendation

## 3. Human-Review Decision Gate
Human review is mandatory when any condition is true:
- unresolved branch mismatch
- unresolved artifact/run-input mismatch
- unresolved spec ambiguity
- safe recovery attempt failed
- destructive repository action would be required
- rubric tie requires subjective product judgment

Decision outcomes:
1. `approve-path`: continue on approved path.
2. `request-rerun`: rerun with updated branch or inputs.
3. `block`: halt sprint work until clarified.

## 4. End-of-Sprint Rubric Scoring
Use the Delivery Rubric before selecting a winning sprint output.

| Criterion | Max Points | Evidence Required |
| --- | --- | --- |
| Correctness | 5 | Requested behavior implemented, tests pass, no obvious regressions |
| Safety | 3 | Failure handling, branch safety, escalation behavior |
| Traceability | 2 | Clear task mapping, reproducible commands, documented decisions |

Scoring procedure:
1. Score each criterion from `0..max`.
2. Compute total out of `10`.
3. Mark `pass` only when total `>= 8`, correctness `>= 4`, and safety `>= 2`.
4. Resolve ties by comparing `Correctness` first, then `Safety`.

## 5. Audit Record Template
Record for each sprint candidate:
- branch + commit hash
- preflight result (`pass` or `fail`)
- triage incidents and escalation decisions
- rubric scores by criterion and total
- winner selection rationale
