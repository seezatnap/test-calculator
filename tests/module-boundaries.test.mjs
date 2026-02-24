import test from "node:test";
import assert from "node:assert/strict";

import { createAppModule } from "../dist/app/index.js";
import { createEngineModule } from "../dist/engine/index.js";
import { createInputModule } from "../dist/input/index.js";
import { createRenderModule } from "../dist/render/index.js";
import {
  MAX_HISTORY_ENTRIES,
  createInitialState
} from "../dist/contracts/state.js";

test("typed module factories expose stable boundary markers", () => {
  const app = createAppModule();
  const engine = createEngineModule();
  const input = createInputModule();
  const render = createRenderModule();

  assert.equal(app.module, "app");
  assert.equal(engine.module, "engine");
  assert.equal(input.module, "input");
  assert.equal(render.module, "render");
});

test("app composition routes keyboard input through input->engine->state", () => {
  const app = createAppModule();

  app.processInput({ source: "keyboard", key: "4" });
  app.processInput({ source: "keyboard", key: "2" });
  app.processInput({ source: "keyboard", key: "Enter" });

  const state = app.getState();

  assert.equal(state.expression, "42");
  assert.equal(state.resultPreview, "42");
  assert.equal(state.errorMessage, null);
  assert.equal(state.ans, "42");
  assert.equal(state.history.length, 1);
});

test("input module maps pointer controls to typed actions", () => {
  const input = createInputModule();

  assert.deepEqual(input.translate({ source: "pointer", key: "C" }), [
    { type: "input/clear", source: "pointer" }
  ]);

  assert.deepEqual(input.translate({ source: "pointer", key: "ANS" }), [
    { type: "input/insert-text", source: "pointer", text: "ANS" }
  ]);
});

test("render module returns explicit fallback capabilities", () => {
  const render = createRenderModule({
    capabilities: {
      webgl2: false,
      webgl1: false,
      fallbackMessage: "WebGL is unavailable."
    }
  });

  assert.deepEqual(render.preflight(), {
    webgl2: false,
    webgl1: false,
    fallbackMessage: "WebGL is unavailable."
  });
});

test("engine restore snapshot enforces history retention contract", () => {
  const engine = createEngineModule();
  const state = createInitialState();

  const overLimitHistory = Array.from({ length: MAX_HISTORY_ENTRIES + 5 }, (_, index) => ({
    expression: `${index}`,
    result: `${index}`,
    evaluatedAtIso: "2026-01-01T00:00:00.000Z"
  }));

  const nextState = engine.reduce(state, {
    type: "app/restore-snapshot",
    source: "system",
    ans: "24",
    history: overLimitHistory,
    preferences: {
      crtEnabled: true
    }
  });

  assert.equal(nextState.history.length, MAX_HISTORY_ENTRIES);
  assert.equal(nextState.history[0].expression, "5");
  assert.equal(nextState.preferences.crtEnabled, true);
});
