import test from "node:test";
import assert from "node:assert/strict";

import {
  RUBRIC_REVIEW_THRESHOLD,
  buildFailureTriagePath,
  evaluateHumanReviewDecisionGate,
  runPreflightChecks,
  scoreSprintRubric
} from "../dist/app/delivery-operations.js";

test("runPreflightChecks passes when branch and artifacts are valid", () => {
  const result = runPreflightChecks({
    branch: {
      currentBranch: "phase-1-webgl-foundation-agent-aaron-wqzlt1",
      expectedAgentBranch: "phase-1-webgl-foundation-agent-aaron-wqzlt1",
      sprintBranch: "phase-1-webgl-foundation-sprint-1-wqzlt1",
      driftDetected: false
    },
    artifacts: [
      {
        artifactName: "prompt",
        artifactPath: ".swarm-hug/phase-1-webgl-foundation/prompt.md",
        exists: true,
        runInputProvided: true
      }
    ]
  });

  assert.equal(result.passed, true);
  assert.deepEqual(result.issues, []);
});

test("runPreflightChecks fails on branch mismatch and missing artifact input", () => {
  const result = runPreflightChecks({
    branch: {
      currentBranch: "wrong-branch",
      expectedAgentBranch: "phase-1-webgl-foundation-agent-aaron-wqzlt1",
      sprintBranch: "",
      driftDetected: true
    },
    artifacts: [
      {
        artifactName: "tasks",
        artifactPath: ".swarm-hug/phase-1-webgl-foundation/tasks.md",
        exists: false,
        runInputProvided: false
      }
    ]
  });

  assert.equal(result.passed, false);
  assert.ok(result.issues.some((issue) => issue.code === "branch_mismatch"));
  assert.ok(result.issues.some((issue) => issue.code === "branch_drift"));
  assert.ok(result.issues.some((issue) => issue.code === "artifact_missing"));
});

test("buildFailureTriagePath escalates branch mismatch to human reviewer", () => {
  const path = buildFailureTriagePath({
    kind: "branch_mismatch",
    summary: "agent branch does not match assigned branch"
  });

  assert.equal(path.escalated, true);
  assert.equal(path.steps[0].owner, "agent");
  assert.equal(path.steps[1].owner, "human-reviewer");
  assert.equal(path.steps[0].blocking, true);
});

test("evaluateHumanReviewDecisionGate requests review for low rubric", () => {
  const decision = evaluateHumanReviewDecisionGate({
    preflightPassed: true,
    branchDriftDetected: false,
    specAmbiguityDetected: false,
    unresolvedFailures: [],
    rubricScorePercent: RUBRIC_REVIEW_THRESHOLD - 1
  });

  assert.equal(decision.decision, "request-human-review");
  assert.ok(decision.reasons.some((reason) => reason.includes("below threshold")));
});

test("scoreSprintRubric returns weighted score and winner eligibility", () => {
  const result = scoreSprintRubric({
    preflightOperations: 4,
    triageReadiness: 4,
    moduleContracts: 5,
    validationEvidence: 4,
    handoffQuality: 5
  });

  assert.equal(result.weightedScorePercent, 88);
  assert.equal(result.band, "pass");
  assert.equal(result.winnerEligible, true);
});
