import type { AppAction } from "../contracts/actions.js";
import { createInitialState, type AppState } from "../contracts/state.js";
import { createEngineModule, type EngineModule } from "../engine/index.js";
import {
  createInputModule,
  type InputModule,
  type InputSignal
} from "../input/index.js";
import {
  createRenderModule,
  type RenderCapabilities,
  type RenderFrame,
  type RenderModule
} from "../render/index.js";

export interface FrameClock {
  readonly nowMs: number;
  readonly deltaMs: number;
}

export interface AppDependencies {
  readonly render: RenderModule;
  readonly engine: EngineModule;
  readonly input: InputModule;
}

export interface AppModule {
  readonly module: "app";
  getState(): Readonly<AppState>;
  dispatch(action: AppAction): void;
  dispatchMany(actions: readonly AppAction[]): void;
  processInput(signal: InputSignal): readonly AppAction[];
  frame(clock: FrameClock): readonly AppAction[];
  preflightRender(): RenderCapabilities;
  dispose(): void;
}

export function createAppModule(
  dependencies: Partial<AppDependencies> = {}
): AppModule {
  const render = dependencies.render ?? createRenderModule();
  const engine = dependencies.engine ?? createEngineModule();
  const input = dependencies.input ?? createInputModule();

  let state = createInitialState();

  const dispatch = (action: AppAction): void => {
    state = engine.reduce(state, action);
  };

  const dispatchMany = (actions: readonly AppAction[]): void => {
    for (const action of actions) {
      dispatch(action);
    }
  };

  return {
    module: "app",
    getState() {
      return state;
    },
    dispatch,
    dispatchMany,
    processInput(signal) {
      const actions = input.translate(signal);
      dispatchMany(actions);
      return actions;
    },
    frame(clock) {
      const frame: RenderFrame = {
        state,
        nowMs: clock.nowMs,
        deltaMs: clock.deltaMs
      };

      const output = render.render(frame);
      dispatchMany(output.actions);
      return output.actions;
    },
    preflightRender() {
      return render.preflight();
    },
    dispose() {
      render.dispose();
    }
  };
}
