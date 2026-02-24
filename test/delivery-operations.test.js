const assert = require("node:assert/strict");
const test = require("node:test");

const { createApp } = require("../dist/src/app/index.js");
const {
  buildFailureTriagePath,
  evaluateHumanReviewGate,
  runPreflightChecks,
  scoreEndOfSprintRubric
} = require("../dist/src/app/delivery-operations.js");
const { createInitialAppState } = require("../dist/src/contracts/state.js");

test("runPreflightChecks passes with aligned branches and valid inputs", () => {
  const report = runPreflightChecks({
    branchAlignment: {
      expectedSourceBranch: "main",
      expectedTargetBranch: "feature/phase-1",
      actualSourceBranch: "main",
      actualTargetBranch: "feature/phase-1"
    },
    artifacts: [{ name: "tasks", path: ".swarm-hug/tasks.md", exists: true, valid: true }],
    runInputs: [{ name: "email", provided: true, valid: true }],
    checkedAtIso: "2026-02-24T00:00:00.000Z"
  });

  assert.equal(report.status, "pass");
  assert.equal(report.issues.length, 0);
});

test("runPreflightChecks reports branch drift and invalid artifacts/run-inputs", () => {
  const report = runPreflightChecks({
    branchAlignment: {
      expectedSourceBranch: "main",
      expectedTargetBranch: "feature/phase-1",
      actualSourceBranch: "develop",
      actualTargetBranch: "feature/phase-1-drift"
    },
    artifacts: [
      { name: "tasks", path: ".swarm-hug/tasks.md", exists: false, valid: false },
      { name: "specs", path: ".swarm-hug/specs.md", exists: true, valid: false, details: "empty" }
    ],
    runInputs: [
      { name: "email", provided: false, valid: false },
      { name: "sprint-count", provided: true, valid: false, details: "must be > 0" }
    ],
    checkedAtIso: "2026-02-24T00:00:00.000Z"
  });

  assert.equal(report.status, "fail");
  assert.equal(report.issues.length, 6);

  const triage = buildFailureTriagePath(report);
  assert.equal(triage[0].stage, "branch-clarification");
  assert.equal(triage[triage.length - 1].stage, "request-human-review");
});

test("evaluateHumanReviewGate requires review for branch mismatch and retry exhaustion", () => {
  const preflightReport = runPreflightChecks({
    branchAlignment: {
      expectedSourceBranch: "main",
      expectedTargetBranch: "feature/phase-1",
      actualSourceBranch: "hotfix",
      actualTargetBranch: "feature/phase-1"
    },
    artifacts: [],
    runInputs: []
  });

  const gate = evaluateHumanReviewGate({
    preflightReport,
    triageAttempts: 2
  });

  assert.equal(gate.requiresHumanReview, true);
  assert.equal(gate.decision, "review-required");
  assert.ok(gate.reasons.length >= 2);
});

test("scoreEndOfSprintRubric returns weighted pass percentage", () => {
  const score = scoreEndOfSprintRubric({
    preflightChecks: 5,
    triagePath: 4,
    humanGate: 4,
    typedModuleBoundaries: 5,
    validationAndTests: 4
  });

  assert.equal(score.weightedScore, 4.5);
  assert.equal(score.percentage, 90);
  assert.equal(score.outcome, "pass");
});

test("createApp wires render, engine, and input modules through shared contracts", () => {
  const renderCalls = [];
  let boundBridge;
  let boundTarget;

  const render = {
    initialize: (surface) => {
      renderCalls.push({ type: "init", surface });
    },
    render: (frame) => {
      renderCalls.push({ type: "render", frame });
    },
    destroy: () => {
      renderCalls.push({ type: "destroy" });
    }
  };

  const engine = {
    reduce: (state, action) => {
      if (action.type === "input/append-token") {
        return {
          ...state,
          expression: `${state.expression}${action.token}`,
          history: [...state.history],
          preferences: { ...state.preferences }
        };
      }

      return {
        ...state,
        history: [...state.history],
        preferences: { ...state.preferences }
      };
    },
    evaluate: () => ({ ok: true, value: "0", normalizedExpression: "0" })
  };

  const input = {
    bind: (target, bridge) => {
      boundTarget = target;
      boundBridge = bridge;
    },
    unbind: () => {
      renderCalls.push({ type: "unbind" });
    }
  };

  const app = createApp(createInitialAppState(), { render, engine, input });
  const fakeTarget = {
    addEventListener: () => undefined,
    removeEventListener: () => undefined
  };

  app.start({ width: 320, height: 240, devicePixelRatio: 2 }, fakeTarget);
  assert.equal(boundTarget, fakeTarget);
  assert.ok(boundBridge);

  boundBridge.dispatch({
    type: "input/append-token",
    token: "7",
    origin: "keyboard",
    timestampMs: Date.now()
  });

  assert.equal(app.getState().expression, "7");
  app.stop();
  assert.equal(renderCalls[0].type, "init");
  assert.equal(renderCalls[renderCalls.length - 1].type, "destroy");
});
