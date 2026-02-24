import { AppAction, AppState, createInitialState } from "../contracts";
import { Engine } from "../engine";
import { InputAdapter } from "../input";
import { RenderFrame, RenderSurface, Renderer } from "../render";

export interface AppModules {
  engine: Engine;
  input: InputAdapter;
  renderer: Renderer;
  now?: () => number;
}

export interface AppController {
  readonly module: "app";
  start(surface: RenderSurface): void;
  dispatch(action: AppAction): AppState;
  getState(): AppState;
  stop(): void;
}

export const createAppController = (modules: AppModules): AppController => {
  let state = modules.engine.getInitialState();
  let started = false;
  const now = modules.now ?? (() => Date.now());

  const drawCurrentFrame = (): RenderFrame => {
    const frame: RenderFrame = {
      nowMs: now(),
      state,
    };
    modules.renderer.draw(frame);
    return frame;
  };

  const dispatch = (action: AppAction): AppState => {
    state = modules.engine.reduce(state, action);
    if (started) {
      drawCurrentFrame();
    }
    return state;
  };

  return {
    module: "app",
    start(surface: RenderSurface): void {
      if (started) {
        return;
      }
      modules.renderer.initialize(surface);
      modules.input.attach((action) => {
        dispatch(action);
      });
      started = true;
      drawCurrentFrame();
    },
    dispatch,
    getState(): AppState {
      return state;
    },
    stop(): void {
      if (!started) {
        return;
      }
      modules.input.detach();
      modules.renderer.dispose();
      started = false;
    },
  };
};

export const createDefaultAppState = (): AppState => createInitialState();
