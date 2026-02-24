import type { AppAction } from "../contracts/actions.js";
import type { AppState } from "../contracts/state.js";

export interface RenderCapabilities {
  readonly webgl2: boolean;
  readonly webgl1: boolean;
  readonly fallbackMessage: string | null;
}

export interface RenderFrame {
  readonly state: Readonly<AppState>;
  readonly nowMs: number;
  readonly deltaMs: number;
}

export interface RenderOutput {
  readonly actions: readonly AppAction[];
}

export interface RenderModule {
  readonly module: "render";
  preflight(): RenderCapabilities;
  render(frame: RenderFrame): RenderOutput;
  dispose(): void;
}

export interface RenderModuleOptions {
  readonly capabilities?: RenderCapabilities;
}

const DEFAULT_CAPABILITIES: RenderCapabilities = {
  webgl2: true,
  webgl1: true,
  fallbackMessage: null
};

export function createRenderModule(
  options: RenderModuleOptions = {}
): RenderModule {
  const capabilities = options.capabilities ?? DEFAULT_CAPABILITIES;

  return {
    module: "render",
    preflight() {
      return capabilities;
    },
    render() {
      return {
        actions: []
      };
    },
    dispose() {
      return;
    }
  };
}
