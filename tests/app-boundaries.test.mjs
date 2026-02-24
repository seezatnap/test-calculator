import assert from "node:assert/strict";
import test from "node:test";

import {
  createAppRuntime,
  createInitialCalculatorState
} from "../build/src/app/index.js";
import { createPassThroughEngine } from "../build/src/engine/index.js";

test("createAppRuntime wires render, engine, and input boundaries", () => {
  let setupCalls = 0;
  let teardownCalls = 0;
  let inputDisposed = 0;
  let inputDispatch = null;
  const renderedActions = [];

  const renderModule = {
    setup() {
      setupCalls += 1;
    },
    render(_state, action) {
      renderedActions.push(action.type);
    },
    teardown() {
      teardownCalls += 1;
    }
  };

  const inputModule = {
    attach(dispatch) {
      inputDispatch = dispatch;
      return {
        handleKeyboard() {
          dispatch({
            type: "input/append-token",
            token: "7",
            source: "keyboard"
          });
        },
        handlePointer() {
          return;
        },
        dispose() {
          inputDisposed += 1;
        }
      };
    }
  };

  const runtime = createAppRuntime({
    initialState: createInitialCalculatorState(),
    modules: {
      render: renderModule,
      engine: createPassThroughEngine(),
      input: inputModule
    },
    renderEnvironment: {
      canvas: {
        width: 320,
        height: 480,
        getContext() {
          return null;
        }
      },
      devicePixelRatio: 2
    }
  });

  assert.equal(setupCalls, 1);
  assert.equal(renderedActions[0], "app/bootstrap");
  assert.ok(typeof inputDispatch === "function");

  inputDispatch({
    type: "engine/evaluated",
    expression: "6*7",
    result: "42",
    recordedAtIso: "2026-02-24T00:00:00.000Z"
  });

  const state = runtime.getState();
  assert.equal(state.ans, "42");
  assert.equal(state.resultPreview, "42");
  assert.equal(state.history.length, 1);

  runtime.shutdown();
  assert.equal(teardownCalls, 1);
  assert.equal(inputDisposed, 1);
});
