import type { CalculatorAction } from "../contracts/actions.js";
import type { CalculatorState } from "../contracts/state.js";

export type WebGLContextName = "webgl2" | "webgl" | "experimental-webgl";

export interface CanvasSurface {
  readonly width: number;
  readonly height: number;
  getContext(contextName: WebGLContextName): unknown;
}

export interface RenderEnvironment {
  readonly canvas: CanvasSurface;
  readonly devicePixelRatio: number;
}

export interface RenderModule {
  setup(environment: RenderEnvironment): void;
  render(state: CalculatorState, action: CalculatorAction): void;
  teardown(): void;
}

export function createNoopRenderModule(): RenderModule {
  return {
    setup(): void {
      return;
    },
    render(): void {
      return;
    },
    teardown(): void {
      return;
    }
  };
}
