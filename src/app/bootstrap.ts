const DEFAULT_ROOT_ID = "calculator-app";
const DEFAULT_CANVAS_ID = "calculator-canvas";
const DEFAULT_MESSAGE_ID = "calculator-context-message";
const DEFAULT_CANVAS_WIDTH = 960;
const DEFAULT_CANVAS_HEIGHT = 640;

const WEBGL1_FALLBACK_MESSAGE =
  "WebGL2 is unavailable. Falling back to WebGL1 compatibility mode.";
const WEBGL_UNSUPPORTED_MESSAGE =
  "WebGL is unavailable in this browser. Calculator canvas rendering is not supported.";

export type RenderContextMode = "webgl2" | "webgl" | "none";

export type BootstrapStatus = "ready" | "fallback" | "unsupported";

export type SupportedRenderContext = WebGL2RenderingContext | WebGLRenderingContext;

export interface ContextInitializationResult {
  mode: RenderContextMode;
  context: SupportedRenderContext | null;
  message: string | null;
}

export interface CalculatorBootstrapOptions {
  documentRef?: Document;
  rootId?: string;
  canvasId?: string;
  messageId?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface CalculatorBootstrapResult {
  status: BootstrapStatus;
  mode: RenderContextMode;
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  context: SupportedRenderContext | null;
  messageElement: HTMLParagraphElement;
}

const resolveDocument = (documentRef?: Document): Document => {
  if (documentRef !== undefined) {
    return documentRef;
  }

  const globalDocument = (globalThis as { document?: Document }).document;
  if (globalDocument === undefined) {
    throw new Error("Calculator bootstrap requires a DOM document.");
  }

  return globalDocument;
};

const clearChildren = (element: HTMLElement): void => {
  while (element.firstChild !== null) {
    element.removeChild(element.firstChild);
  }
};

const normalizeDimension = (value: number | undefined, fallback: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.round(value);
};

export const initializePreferredContext = (
  canvas: HTMLCanvasElement
): ContextInitializationResult => {
  const webgl2Context = canvas.getContext("webgl2");
  if (webgl2Context !== null) {
    return {
      mode: "webgl2",
      context: webgl2Context,
      message: null
    };
  }

  const webglContext =
    canvas.getContext("webgl") ?? (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

  if (webglContext !== null) {
    return {
      mode: "webgl",
      context: webglContext,
      message: WEBGL1_FALLBACK_MESSAGE
    };
  }

  return {
    mode: "none",
    context: null,
    message: WEBGL_UNSUPPORTED_MESSAGE
  };
};

export const bootstrapCalculatorPage = (
  options: CalculatorBootstrapOptions = {}
): CalculatorBootstrapResult => {
  const documentRef = resolveDocument(options.documentRef);
  const body = documentRef.body;
  if (body === null) {
    throw new Error("Calculator bootstrap requires a document body element.");
  }

  const root = documentRef.createElement("main");
  root.id = options.rootId ?? DEFAULT_ROOT_ID;
  root.setAttribute("aria-label", "Scientific calculator");

  const canvas = documentRef.createElement("canvas");
  canvas.id = options.canvasId ?? DEFAULT_CANVAS_ID;
  canvas.setAttribute("aria-label", "Scientific calculator display");
  canvas.setAttribute("data-role", "primary-calculator-canvas");
  canvas.width = normalizeDimension(options.canvasWidth, DEFAULT_CANVAS_WIDTH);
  canvas.height = normalizeDimension(options.canvasHeight, DEFAULT_CANVAS_HEIGHT);
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";

  const messageElement = documentRef.createElement("p");
  messageElement.id = options.messageId ?? DEFAULT_MESSAGE_ID;
  messageElement.setAttribute("aria-live", "polite");
  messageElement.style.margin = "0.5rem 0 0";
  messageElement.style.fontFamily = "sans-serif";

  root.appendChild(canvas);
  root.appendChild(messageElement);

  clearChildren(body);
  body.appendChild(root);

  const contextResult = initializePreferredContext(canvas);
  root.setAttribute("data-render-context", contextResult.mode);

  if (contextResult.message === null) {
    messageElement.hidden = true;
    messageElement.textContent = "";
  } else {
    messageElement.hidden = false;
    messageElement.textContent = contextResult.message;
  }

  const status: BootstrapStatus =
    contextResult.mode === "webgl2"
      ? "ready"
      : contextResult.mode === "webgl"
        ? "fallback"
        : "unsupported";

  return {
    status,
    mode: contextResult.mode,
    root,
    canvas,
    context: contextResult.context,
    messageElement
  };
};
