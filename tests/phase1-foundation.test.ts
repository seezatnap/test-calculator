import { createAppController } from "../src/app";
import {
  DELIVERY_RUBRIC,
  runPreflightChecks,
  scoreDeliveryRubric,
  shouldRequestHumanReview,
  triageFailure,
} from "../src/app/delivery-operations";
import { createEngine, Engine } from "../src/engine";
import { createInputAdapter, InputAdapter } from "../src/input";
import { createRenderer, Renderer } from "../src/render";
import { assert, assertEqual, registerTest } from "./harness";

registerTest("module factories satisfy typed boundaries", () => {
  const renderer: Renderer = createRenderer();
  const engine: Engine = createEngine();
  const input: InputAdapter = createInputAdapter();

  assertEqual(renderer.module, "render", "Renderer contract mismatch");
  assertEqual(engine.module, "engine", "Engine contract mismatch");
  assertEqual(input.module, "input", "Input contract mismatch");
});

registerTest("engine reducer handles append/backspace/clear deterministically", () => {
  const engine = createEngine();
  let state = engine.getInitialState();

  state = engine.reduce(state, {
    type: "input/append",
    payload: { value: "1", source: "keyboard" },
  });
  state = engine.reduce(state, {
    type: "input/append",
    payload: { value: "+", source: "keyboard" },
  });
  state = engine.reduce(state, {
    type: "input/append",
    payload: { value: "2", source: "keyboard" },
  });
  assertEqual(state.display.expression, "1+2", "Expression should append sequentially");

  state = engine.reduce(state, {
    type: "input/backspace",
    payload: { source: "keyboard" },
  });
  assertEqual(state.display.expression, "1+", "Backspace should remove one token");

  state = engine.reduce(state, {
    type: "input/clear",
    payload: { source: "keyboard", scope: "entry" },
  });
  assertEqual(state.display.expression, "", "Entry clear should reset expression only");
  assertEqual(state.display.result, "0", "Entry clear should preserve result");
});

registerTest("engine reducer caps history at twenty items on success", () => {
  const engine = createEngine();
  let state = engine.getInitialState();

  for (let index = 0; index < 25; index += 1) {
    state = engine.reduce(state, {
      type: "engine/evaluate-success",
      payload: {
        expression: `${index}`,
        result: `${index}`,
        evaluatedAtIso: `2026-02-24T00:00:${String(index).padStart(2, "0")}Z`,
      },
    });
  }

  assertEqual(state.history.length, 20, "History should retain last twenty calculations");
  assertEqual(state.history[0]?.expression, "24", "Newest history item should be first");
  assertEqual(state.history[19]?.expression, "5", "Oldest retained history item should be bounded");
});

registerTest("input adapter maps keyboard and pointer actions", () => {
  const input = createInputAdapter();

  const keyboardDigit = input.mapKeyboardKey("9");
  assert(keyboardDigit !== null, "Keyboard digit mapping should produce action");
  assertEqual(keyboardDigit.type, "input/append", "Keyboard digit should append");
  if (keyboardDigit.type === "input/append") {
    assertEqual(keyboardDigit.payload.value, "9", "Keyboard digit payload mismatch");
    assertEqual(keyboardDigit.payload.source, "keyboard", "Keyboard source mismatch");
  }

  const pointerEvaluate = input.mapPointerToken("=");
  assert(pointerEvaluate !== null, "Pointer equals should map to evaluate");
  assertEqual(pointerEvaluate.type, "engine/evaluate-request", "Pointer equals action mismatch");

  const pointerFunction = input.mapPointerToken("sqrt");
  assert(pointerFunction !== null, "Pointer function mapping should produce action");
  assertEqual(pointerFunction.type, "input/append", "Pointer function should append token");
  if (pointerFunction.type === "input/append") {
    assertEqual(pointerFunction.payload.value, "sqrt(", "Pointer sqrt payload mismatch");
    assertEqual(pointerFunction.payload.source, "pointer", "Pointer source mismatch");
  }
});

registerTest("app controller wires input dispatch to engine and renderer", () => {
  const renderer = createRenderer();
  const engine = createEngine();
  const input = createInputAdapter();
  const app = createAppController({
    engine,
    input,
    renderer,
    now: () => 42,
  });

  app.start({
    id: "calculator-canvas",
    width: 800,
    height: 480,
  });

  input.emitKeyboardKey("1");
  input.emitKeyboardKey("+");
  input.emitPointerToken("2");

  const state = app.getState();
  assertEqual(state.display.expression, "1+2", "Input should update shared app state");

  const frame = renderer.getLastFrame();
  assert(frame !== null, "Renderer should receive frame updates after dispatch");
  if (frame) {
    assertEqual(frame.nowMs, 42, "Renderer frame clock should use app clock injection");
    assertEqual(frame.state.display.expression, "1+2", "Rendered frame should mirror app state");
  }

  app.stop();
  assertEqual(renderer.getLastFrame(), null, "Stopping app should dispose render state");
});

registerTest("preflight report fails on branch mismatch and missing run input", () => {
  const report = runPreflightChecks({
    currentBranch: "phase-1-webgl-foundation-agent-aaron-2ttysc",
    expectedAgentBranch: "phase-1-webgl-foundation-agent-betty-2ttysc",
    expectedSprintBranch: "phase-1-webgl-foundation-sprint-1-2ttysc",
    artifacts: [{ path: "specs.md", exists: true, hasContent: true }],
    runInputs: [
      { name: "task-id", value: "" },
      { name: "agent", value: "Aaron" },
    ],
  });

  assertEqual(report.status, "fail", "Preflight should fail when alignment or input checks fail");
  assert(
    report.checks.some((check) => check.id === "branch-alignment" && check.status === "fail"),
    "Branch alignment should fail when expected branch differs",
  );
  assert(
    report.checks.some((check) => check.id === "run-input-validation" && check.status === "fail"),
    "Run-input validation should fail when a value is missing",
  );
});

registerTest("failure triage and review gate enforce escalation rules", () => {
  const firstAttempt = triageFailure({
    failingCommand: "npm test",
    shortError: "Type error in engine reducer",
    probableRootCause: "new action payload mismatch",
    failureClass: "build-test",
    safeRecoveryAttempted: false,
    safeRecoverySucceeded: false,
  });
  assertEqual(firstAttempt.nextAction, "continue", "First triage should request a safe recovery attempt");

  const escalated = triageFailure({
    failingCommand: "npm test",
    shortError: "Type error in engine reducer",
    probableRootCause: "new action payload mismatch",
    failureClass: "build-test",
    safeRecoveryAttempted: true,
    safeRecoverySucceeded: false,
  });
  assertEqual(
    escalated.nextAction,
    "request-human-review",
    "Failed safe recovery should escalate to human review",
  );

  const humanReviewRequired = shouldRequestHumanReview({
    unresolvedBranchMismatch: false,
    unresolvedArtifactMismatch: false,
    unresolvedSpecConflict: false,
    safeRecoveryFailed: true,
    destructiveOperationRequired: false,
    rubricTieRequiresJudgment: false,
  });
  assertEqual(humanReviewRequired, true, "Human review gate should trip on failed safe recovery");
});

registerTest("rubric scoring applies thresholds and tie-break order", () => {
  assertEqual(DELIVERY_RUBRIC.length, 3, "Delivery rubric should contain three criteria");

  const strong = scoreDeliveryRubric({
    correctness: 5,
    safety: 3,
    traceability: 2,
  });
  assertEqual(strong.total, 10, "Perfect rubric score should total ten");
  assertEqual(strong.pass, true, "Perfect rubric score should pass");
  assertEqual(strong.tieBreakOrder[0], "correctness", "Correctness must be first tie-break criterion");

  const weakCorrectness = scoreDeliveryRubric({
    correctness: 3,
    safety: 3,
    traceability: 2,
  });
  assertEqual(
    weakCorrectness.pass,
    false,
    "Rubric should fail when correctness threshold is below required minimum",
  );
});
