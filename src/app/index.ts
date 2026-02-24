import type { AppAction, AppState } from "../contracts";
import type { EngineModule } from "../engine";
import type { EventTargetLike, InputModule } from "../input";
import type { RenderModule, RenderSurface } from "../render";

const cloneState = (state: Readonly<AppState>): AppState => ({
  ...state,
  history: [...state.history],
  preferences: { ...state.preferences }
});

export interface AppModules {
  render: RenderModule;
  engine: EngineModule;
  input: InputModule;
}

export interface AppController {
  start(surface: RenderSurface, inputTarget: EventTargetLike): void;
  dispatch(action: AppAction): void;
  getState(): Readonly<AppState>;
  stop(): void;
}

export const createApp = (initialState: AppState, modules: AppModules): AppController => {
  let state = cloneState(initialState);
  let started = false;
  let recentAction: AppAction | null = null;

  const getState = (): Readonly<AppState> => cloneState(state);

  const dispatch = (action: AppAction): void => {
    state = modules.engine.reduce(state, action);
    recentAction = action;

    if (started) {
      modules.render.render({
        state,
        recentAction,
        timestampMs: Date.now()
      });
    }
  };

  return {
    start: (surface, inputTarget) => {
      if (started) {
        return;
      }

      started = true;
      modules.render.initialize(surface);
      modules.input.bind(inputTarget, { dispatch, getState });
      modules.render.render({
        state,
        recentAction,
        timestampMs: Date.now()
      });
    },
    dispatch,
    getState,
    stop: () => {
      if (!started) {
        return;
      }

      modules.input.unbind();
      modules.render.destroy();
      started = false;
      recentAction = null;
    }
  };
};

export * from "./delivery-operations";
export * from "./bootstrap";
