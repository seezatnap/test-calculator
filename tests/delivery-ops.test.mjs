import assert from "node:assert/strict";
import test from "node:test";

import {
  compareDeliveryScores,
  runPreflightChecks,
  scoreDeliveryRubric,
  triageFailure,
  evaluateHumanReviewGate
} from "../build/src/app/delivery-ops.js";

test("runPreflightChecks passes on aligned branch and complete inputs", () => {
  const report = runPreflightChecks({
    currentBranch: "phase-1-webgl-foundation-agent-aaron-fth0z1",
    expectedBranch: "phase-1-webgl-foundation-agent-aaron-fth0z1",
    artifacts: [
      { path: ".morgan/source-files/01-phase1webglfoundation-instructions.md", present: true },
      { path: "prds/phase-1-webgl-foundation-prd.md", present: true }
    ],
    runInputs: {
      artifact: "Phase1WebGLFoundation",
      sourceBranch: "main",
      targetBranch: "feature/phase-1-webgl-foundation"
    },
    requiredRunInputKeys: ["artifact", "sourceBranch", "targetBranch"]
  });

  assert.equal(report.passed, true);
  assert.deepEqual(
    report.checks.map((check) => check.status),
    ["pass", "pass", "pass"]
  );
  assert.deepEqual(report.requiredActions, []);
});

test("runPreflightChecks fails when branch, artifacts, and run inputs drift", () => {
  const report = runPreflightChecks({
    currentBranch: "feature/mismatch",
    expectedBranch: "phase-1-webgl-foundation-agent-aaron-fth0z1",
    artifacts: [{ path: "prds/phase-1-webgl-foundation-prd.md", present: false }],
    runInputs: {
      artifact: "",
      sourceBranch: "main"
    },
    requiredRunInputKeys: ["artifact", "sourceBranch", "targetBranch"]
  });

  assert.equal(report.passed, false);
  assert.equal(report.checks[0].status, "fail");
  assert.equal(report.checks[1].status, "fail");
  assert.equal(report.checks[2].status, "fail");
  assert.equal(report.requiredActions.length, 3);
});

test("runPreflightChecks fails when Phase 1 intent values are non-empty but wrong", () => {
  const report = runPreflightChecks({
    currentBranch: "phase-1-webgl-foundation-agent-aaron-fth0z1",
    expectedBranch: "phase-1-webgl-foundation-agent-aaron-fth0z1",
    artifacts: [
      { path: ".morgan/source-files/01-phase1webglfoundation-instructions.md", present: true },
      { path: "prds/phase-1-webgl-foundation-prd.md", present: true }
    ],
    runInputs: {
      artifact: "Phase2ScientificDepth",
      sourceBranch: "develop",
      targetBranch: "feature/phase-2-scientific-depth"
    },
    requiredRunInputKeys: ["artifact", "sourceBranch", "targetBranch"]
  });

  assert.equal(report.passed, false);
  assert.deepEqual(
    report.checks.map((check) => check.status),
    ["pass", "pass", "fail"]
  );
  assert.match(report.checks[2].details, /artifact \(expected "Phase1WebGLFoundation"/);
  assert.match(report.checks[2].details, /sourceBranch \(expected "main"/);
  assert.match(
    report.checks[2].details,
    /targetBranch \(expected "feature\/phase-1-webgl-foundation"/
  );
});

test("runPreflightChecks fails when artifacts are present but omit expected Phase 1 paths", () => {
  const report = runPreflightChecks({
    currentBranch: "phase-1-webgl-foundation-agent-aaron-fth0z1",
    expectedBranch: "phase-1-webgl-foundation-agent-aaron-fth0z1",
    artifacts: [
      { path: ".morgan/source-files/phase-2-instructions.md", present: true },
      { path: "prds/phase-2-scientific-depth-prd.md", present: true }
    ],
    runInputs: {
      artifact: "Phase1WebGLFoundation",
      sourceBranch: "main",
      targetBranch: "feature/phase-1-webgl-foundation"
    },
    requiredRunInputKeys: ["artifact", "sourceBranch", "targetBranch"]
  });

  assert.equal(report.passed, false);
  assert.deepEqual(
    report.checks.map((check) => check.status),
    ["pass", "fail", "pass"]
  );
  assert.match(
    report.checks[1].details,
    /\.morgan\/source-files\/01-phase1webglfoundation-instructions\.md/
  );
  assert.match(report.checks[1].details, /prds\/phase-1-webgl-foundation-prd\.md/);
});

test("triageFailure routes failed recovery to human review", () => {
  const decision = triageFailure({
    failingCommand: "npm test",
    shortError: "Type mismatch in reducer",
    probableRootCause: "incomplete action contract",
    branch: "phase-1-webgl-foundation-agent-aaron-fth0z1",
    logPath: ".morgan/runs/failure.log",
    recoveryStatus: "failed"
  });

  assert.equal(decision.nextStep, "request-human-review");
  assert.match(decision.summary, /Safe recovery failed/i);
});

test("evaluateHumanReviewGate combines preflight and triage escalation", () => {
  const preflight = runPreflightChecks({
    currentBranch: "feature/mismatch",
    expectedBranch: "phase-1-webgl-foundation-agent-aaron-fth0z1",
    artifacts: [
      { path: ".morgan/source-files/01-phase1webglfoundation-instructions.md", present: true },
      { path: "prds/phase-1-webgl-foundation-prd.md", present: true }
    ],
    runInputs: { artifact: "Phase1WebGLFoundation" },
    requiredRunInputKeys: ["artifact", "targetBranch"]
  });

  const triage = triageFailure({
    failingCommand: "npm run build",
    shortError: "build failed",
    probableRootCause: "missing contract export",
    branch: "phase-1-webgl-foundation-agent-aaron-fth0z1",
    logPath: ".morgan/runs/failure.log",
    recoveryStatus: "failed"
  });

  const gate = evaluateHumanReviewGate({
    preflight,
    triage
  });

  assert.equal(gate.requiresHumanReview, true);
  assert.deepEqual(gate.reasons.sort(), [
    "branch-drift",
    "run-input-invalid",
    "safe-recovery-failed"
  ]);
});

test("scoreDeliveryRubric clamps values and enforces quality threshold", () => {
  const full = scoreDeliveryRubric({
    correctness: 5,
    safety: 3,
    traceability: 2
  });

  const belowThreshold = scoreDeliveryRubric({
    correctness: 4,
    safety: 2,
    traceability: 1
  });

  const clamped = scoreDeliveryRubric({
    correctness: 20,
    safety: -4,
    traceability: 2
  });

  assert.equal(full.total, 10);
  assert.equal(full.pass, true);
  assert.equal(belowThreshold.total, 7);
  assert.equal(belowThreshold.pass, false);
  assert.equal(clamped.correctness, 5);
  assert.equal(clamped.safety, 0);
});

test("compareDeliveryScores applies rubric tie-breakers", () => {
  const left = scoreDeliveryRubric({
    correctness: 5,
    safety: 2,
    traceability: 1
  });

  const right = scoreDeliveryRubric({
    correctness: 4,
    safety: 3,
    traceability: 1
  });

  assert.equal(left.total, right.total);
  assert.ok(compareDeliveryScores(left, right) > 0);
});
