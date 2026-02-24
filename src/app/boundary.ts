import type {
  ActionDispatch,
  CalculatorAction
} from "../contracts/actions.js";
import type { CalculatorState } from "../contracts/state.js";
import type { EngineModule } from "../engine/boundary.js";
import type { InputModule } from "../input/boundary.js";
import type { RenderEnvironment, RenderModule } from "../render/boundary.js";

export interface AppModules {
  readonly render: RenderModule;
  readonly engine: EngineModule;
  readonly input: InputModule;
}

export interface AppBootstrapOptions {
  readonly initialState: CalculatorState;
  readonly modules: AppModules;
  readonly renderEnvironment: RenderEnvironment;
}

export interface AppRuntime {
  readonly dispatch: ActionDispatch;
  readonly getState: () => CalculatorState;
  shutdown(): void;
}

export function createAppRuntime(options: AppBootstrapOptions): AppRuntime {
  const { modules, renderEnvironment } = options;
  let state = options.initialState;

  modules.render.setup(renderEnvironment);

  const processAction = (action: CalculatorAction): void => {
    const transition = modules.engine.reduce(state, action);
    state = transition.state;
    modules.render.render(state, action);

    for (const emittedAction of transition.emittedActions) {
      processAction(emittedAction);
    }
  };

  const dispatch: ActionDispatch = (action) => {
    processAction(action);
  };

  const inputBinding = modules.input.attach(dispatch);
  dispatch({ type: "app/bootstrap" });

  return {
    dispatch,
    getState() {
      return state;
    },
    shutdown() {
      inputBinding.dispose();
      modules.render.teardown();
    }
  };
}
