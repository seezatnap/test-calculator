const assert = require("node:assert/strict");
const test = require("node:test");

const {
  bootstrapCalculatorPage,
  initializePreferredContext
} = require("../dist/src/app/bootstrap.js");

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.parentNode = null;
    this.id = "";
    this.textContent = "";
    this.hidden = false;
    this.style = {};
    this.firstChild = null;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    this.firstChild = this.children[0] ?? null;
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
    }
    child.parentNode = null;
    this.firstChild = this.children[0] ?? null;
    return child;
  }
}

class FakeCanvasElement extends FakeElement {
  constructor(contextMap) {
    super("canvas");
    this.contextMap = contextMap;
    this.width = 0;
    this.height = 0;
  }

  getContext(name) {
    return this.contextMap[name] ?? null;
  }
}

class FakeDocument {
  constructor(contextMap) {
    this.contextMap = contextMap;
    this.body = new FakeElement("body");
  }

  createElement(tagName) {
    if (tagName === "canvas") {
      return new FakeCanvasElement(this.contextMap);
    }

    return new FakeElement(tagName);
  }
}

const collectByTag = (element, tagName) => {
  const result = [];
  for (const child of element.children) {
    if (child.tagName === tagName) {
      result.push(child);
    }
    result.push(...collectByTag(child, tagName));
  }
  return result;
};

test("initializePreferredContext prefers WebGL2 when available", () => {
  const webgl2 = { renderer: "webgl2" };
  const canvas = new FakeCanvasElement({ webgl2 });
  const result = initializePreferredContext(canvas);

  assert.equal(result.mode, "webgl2");
  assert.equal(result.context, webgl2);
  assert.equal(result.message, null);
});

test("bootstrapCalculatorPage creates one canvas and hides message for WebGL2", () => {
  const webgl2 = { renderer: "webgl2" };
  const fakeDocument = new FakeDocument({ webgl2 });

  const result = bootstrapCalculatorPage({ documentRef: fakeDocument });

  assert.equal(result.status, "ready");
  assert.equal(result.mode, "webgl2");
  assert.equal(result.messageElement.hidden, true);
  assert.equal(result.messageElement.textContent, "");
  assert.equal(result.canvas.width, 960);
  assert.equal(result.canvas.height, 640);
  assert.equal(result.root.attributes["data-render-context"], "webgl2");

  const canvases = collectByTag(fakeDocument.body, "canvas");
  assert.equal(canvases.length, 1);
  assert.equal(canvases[0].attributes["data-role"], "primary-calculator-canvas");
});

test("bootstrapCalculatorPage reports explicit fallback message on WebGL1", () => {
  const webgl = { renderer: "webgl1" };
  const fakeDocument = new FakeDocument({ webgl });

  const result = bootstrapCalculatorPage({ documentRef: fakeDocument });

  assert.equal(result.status, "fallback");
  assert.equal(result.mode, "webgl");
  assert.equal(result.messageElement.hidden, false);
  assert.match(result.messageElement.textContent, /WebGL2 is unavailable/);
  assert.equal(result.root.attributes["data-render-context"], "webgl");
});

test("bootstrapCalculatorPage reports explicit unsupported message when WebGL is unavailable", () => {
  const fakeDocument = new FakeDocument({});

  const result = bootstrapCalculatorPage({ documentRef: fakeDocument });

  assert.equal(result.status, "unsupported");
  assert.equal(result.mode, "none");
  assert.equal(result.context, null);
  assert.equal(result.messageElement.hidden, false);
  assert.match(result.messageElement.textContent, /WebGL is unavailable/);
  assert.equal(result.root.attributes["data-render-context"], "none");
});

test("bootstrapCalculatorPage replaces previous page content and keeps one primary canvas", () => {
  const webgl2 = { renderer: "webgl2" };
  const fakeDocument = new FakeDocument({ webgl2 });

  bootstrapCalculatorPage({ documentRef: fakeDocument });
  bootstrapCalculatorPage({ documentRef: fakeDocument });

  const canvases = collectByTag(fakeDocument.body, "canvas");
  assert.equal(canvases.length, 1);
});
