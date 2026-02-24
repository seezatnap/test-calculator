import type { CanvasSurface, WebGLContextName } from "../render/boundary.js";

export interface SinglePageElement {
  id: string;
  textContent: string | null;
  append(...children: ReadonlyArray<SinglePageElement>): void;
  replaceChildren(...children: ReadonlyArray<SinglePageElement>): void;
  setAttribute(name: string, value: string): void;
}

export interface SinglePageCanvasElement
  extends SinglePageElement,
    CanvasSurface {}

export interface SinglePageDocument {
  readonly body: SinglePageElement;
  createElement(tagName: "main"): SinglePageElement;
  createElement(tagName: "canvas"): SinglePageCanvasElement;
  createElement(tagName: "p"): SinglePageElement;
}

export type WebGLSupportTier = "webgl2" | "webgl1" | "unsupported";

export interface WebGLInitializationResult {
  readonly tier: WebGLSupportTier;
  readonly contextName: WebGLContextName | null;
  readonly context: unknown;
  readonly fallbackMessage: string | null;
}

export interface SinglePageBootstrapResult {
  readonly root: SinglePageElement;
  readonly canvas: SinglePageCanvasElement;
  readonly statusMessage: SinglePageElement;
  readonly webgl: WebGLInitializationResult;
}

export const APP_ROOT_ID = "calculator-app";
export const PRIMARY_CANVAS_ID = "calculator-canvas";
export const STATUS_MESSAGE_ID = "calculator-webgl-status";

const WEBGL_CANDIDATES: ReadonlyArray<{
  readonly name: WebGLContextName;
  readonly tier: Exclude<WebGLSupportTier, "unsupported">;
}> = [
  { name: "webgl2", tier: "webgl2" },
  { name: "webgl", tier: "webgl1" },
  { name: "experimental-webgl", tier: "webgl1" }
];

export function initializePreferredWebGLContext(
  canvas: CanvasSurface
): WebGLInitializationResult {
  for (const candidate of WEBGL_CANDIDATES) {
    const context = canvas.getContext(candidate.name);
    if (context === null || context === undefined) {
      continue;
    }

    return {
      tier: candidate.tier,
      contextName: candidate.name,
      context,
      fallbackMessage:
        candidate.tier === "webgl1"
          ? "WebGL2 is unavailable; using WebGL1 fallback context."
          : null
    };
  }

  return {
    tier: "unsupported",
    contextName: null,
    context: null,
    fallbackMessage:
      "WebGL is unavailable in this browser. Enable hardware acceleration or use a compatible browser."
  };
}

export function bootstrapSinglePageCalculator(
  documentRef: SinglePageDocument
): SinglePageBootstrapResult {
  const root = documentRef.createElement("main");
  root.id = APP_ROOT_ID;
  root.setAttribute("data-app-shell", "calculator");

  const canvas = documentRef.createElement("canvas");
  canvas.id = PRIMARY_CANVAS_ID;
  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    "Scientific calculator interface rendered on canvas"
  );
  canvas.setAttribute("data-primary-canvas", "true");

  const statusMessage = documentRef.createElement("p");
  statusMessage.id = STATUS_MESSAGE_ID;
  statusMessage.setAttribute("role", "status");
  statusMessage.setAttribute("aria-live", "polite");

  root.append(canvas, statusMessage);
  documentRef.body.replaceChildren(root);

  const webgl = initializePreferredWebGLContext(canvas);
  statusMessage.textContent = webgl.fallbackMessage ?? "";
  statusMessage.setAttribute(
    "data-fallback-visible",
    webgl.fallbackMessage === null ? "false" : "true"
  );

  return {
    root,
    canvas,
    statusMessage,
    webgl
  };
}
