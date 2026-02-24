import { AppState } from "../contracts";

export interface RenderSurface {
  id: string;
  width: number;
  height: number;
}

export interface RenderViewport {
  widthCssPx: number;
  heightCssPx: number;
  devicePixelRatio: number;
}

export interface RenderFrame {
  nowMs: number;
  state: AppState;
}

export interface Renderer {
  readonly module: "render";
  initialize(surface: RenderSurface): void;
  resize(viewport: RenderViewport): void;
  draw(frame: RenderFrame): void;
  getSurface(): RenderSurface | null;
  getViewport(): RenderViewport | null;
  getLastFrame(): RenderFrame | null;
  dispose(): void;
}

export const createRenderer = (): Renderer => {
  let activeSurface: RenderSurface | null = null;
  let activeViewport: RenderViewport | null = null;
  let lastFrame: RenderFrame | null = null;

  return {
    module: "render",
    initialize(surface: RenderSurface): void {
      activeSurface = { ...surface };
      activeViewport = {
        widthCssPx: surface.width,
        heightCssPx: surface.height,
        devicePixelRatio: 1,
      };
    },
    resize(viewport: RenderViewport): void {
      activeViewport = { ...viewport };
    },
    draw(frame: RenderFrame): void {
      lastFrame = {
        nowMs: frame.nowMs,
        state: frame.state,
      };
    },
    getSurface(): RenderSurface | null {
      return activeSurface;
    },
    getViewport(): RenderViewport | null {
      return activeViewport;
    },
    getLastFrame(): RenderFrame | null {
      return lastFrame;
    },
    dispose(): void {
      activeSurface = null;
      activeViewport = null;
      lastFrame = null;
    },
  };
};
