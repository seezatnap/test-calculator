import assert from "node:assert/strict";
import test from "node:test";

import {
  APP_ROOT_ID,
  PRIMARY_CANVAS_ID,
  STATUS_MESSAGE_ID,
  bootstrapSinglePageCalculator
} from "../build/src/app/single-page-bootstrap.js";

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.id = "";
    this.textContent = null;
    this.children = [];
    this.attributes = new Map();
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  append(...children) {
    this.children.push(...children);
  }

  replaceChildren(...children) {
    this.children = [...children];
  }
}

class FakeCanvasElement extends FakeElement {
  constructor(contexts) {
    super("canvas");
    this.width = 320;
    this.height = 480;
    this.contexts = contexts;
    this.contextCalls = [];
  }

  getContext(contextName) {
    this.contextCalls.push(contextName);
    return this.contexts[contextName] ?? null;
  }
}

function createFakeDocument(contexts) {
  const body = new FakeElement("body");

  return {
    body,
    createElement(tagName) {
      if (tagName === "canvas") {
        return new FakeCanvasElement(contexts);
      }

      return new FakeElement(tagName);
    }
  };
}

test("bootstrapSinglePageCalculator mounts a single primary canvas and prefers WebGL2", () => {
  const webgl2Context = { version: 2 };
  const fakeDocument = createFakeDocument({
    webgl2: webgl2Context,
    webgl: null,
    "experimental-webgl": null
  });

  const result = bootstrapSinglePageCalculator(fakeDocument);
  const mountedRoot = fakeDocument.body.children[0];
  const mountedCanvases = mountedRoot.children.filter(
    (child) => child.tagName === "canvas"
  );

  assert.equal(fakeDocument.body.children.length, 1);
  assert.equal(result.root.id, APP_ROOT_ID);
  assert.equal(result.canvas.id, PRIMARY_CANVAS_ID);
  assert.equal(result.statusMessage.id, STATUS_MESSAGE_ID);
  assert.equal(mountedCanvases.length, 1);
  assert.equal(result.webgl.tier, "webgl2");
  assert.equal(result.webgl.contextName, "webgl2");
  assert.equal(result.webgl.context, webgl2Context);
  assert.equal(result.webgl.fallbackMessage, null);
  assert.equal(result.statusMessage.textContent, "");
  assert.equal(
    result.statusMessage.attributes.get("data-fallback-visible"),
    "false"
  );
  assert.deepEqual(result.canvas.contextCalls, ["webgl2"]);
});

test("bootstrapSinglePageCalculator falls back to WebGL1 with explicit messaging", () => {
  const webgl1Context = { version: 1 };
  const fakeDocument = createFakeDocument({
    webgl2: null,
    webgl: webgl1Context,
    "experimental-webgl": null
  });

  const result = bootstrapSinglePageCalculator(fakeDocument);

  assert.equal(result.webgl.tier, "webgl1");
  assert.equal(result.webgl.contextName, "webgl");
  assert.equal(result.webgl.context, webgl1Context);
  assert.match(result.webgl.fallbackMessage ?? "", /WebGL2 is unavailable/i);
  assert.equal(result.statusMessage.textContent, result.webgl.fallbackMessage);
  assert.equal(
    result.statusMessage.attributes.get("data-fallback-visible"),
    "true"
  );
  assert.deepEqual(result.canvas.contextCalls, ["webgl2", "webgl"]);
});

test("bootstrapSinglePageCalculator reports unsupported context when no WebGL is available", () => {
  const fakeDocument = createFakeDocument({
    webgl2: null,
    webgl: null,
    "experimental-webgl": null
  });

  const result = bootstrapSinglePageCalculator(fakeDocument);

  assert.equal(result.webgl.tier, "unsupported");
  assert.equal(result.webgl.contextName, null);
  assert.equal(result.webgl.context, null);
  assert.match(result.webgl.fallbackMessage ?? "", /WebGL is unavailable/i);
  assert.equal(result.statusMessage.textContent, result.webgl.fallbackMessage);
  assert.equal(
    result.statusMessage.attributes.get("data-fallback-visible"),
    "true"
  );
  assert.deepEqual(result.canvas.contextCalls, [
    "webgl2",
    "webgl",
    "experimental-webgl"
  ]);
});
