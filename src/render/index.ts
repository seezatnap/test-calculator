import type { AppAction, AppState } from "../contracts";

export interface RenderSurface {
  width: number;
  height: number;
  devicePixelRatio: number;
}

export interface RenderFrame {
  state: Readonly<AppState>;
  recentAction: AppAction | null;
  timestampMs: number;
}

export interface RenderModule {
  initialize(surface: RenderSurface): void;
  render(frame: RenderFrame): void;
  destroy(): void;
}

export const createNoopRenderModule = (): RenderModule => ({
  initialize: () => undefined,
  render: () => undefined,
  destroy: () => undefined
});
