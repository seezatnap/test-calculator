import { AppAction, AppState, HistoryEntry, createInitialState, limitHistory } from "../contracts";

export interface Engine {
  readonly module: "engine";
  getInitialState(): AppState;
  reduce(state: AppState, action: AppAction): AppState;
}

const nextLastAction = (state: AppState, actionType: AppAction["type"]): AppState => ({
  ...state,
  lastActionType: actionType,
});

const nextEditingState = (state: AppState, expression: string): AppState => ({
  ...state,
  display: {
    expression,
    preview: "",
    result: state.display.result,
    status: expression.length === 0 ? "idle" : "editing",
    errorMessage: null,
  },
});

const clearEntry = (state: AppState): AppState => ({
  ...state,
  display: {
    expression: "",
    preview: "",
    result: state.display.result,
    status: "idle",
    errorMessage: null,
  },
});

export const createEngine = (): Engine => ({
  module: "engine",
  getInitialState(): AppState {
    return createInitialState();
  },
  reduce(state: AppState, action: AppAction): AppState {
    switch (action.type) {
      case "app/hydrate": {
        const nextState: AppState = {
          ...state,
          mode: action.payload.mode ?? state.mode,
          ans: action.payload.ans ?? state.ans,
          history: action.payload.history ? limitHistory([...action.payload.history]) : state.history,
          display: {
            ...state.display,
            ...(action.payload.display ?? {}),
          },
          preferences: {
            ...state.preferences,
            ...(action.payload.preferences ?? {}),
          },
          lastActionType: action.type,
        };
        return nextState;
      }
      case "app/set-mode":
        return nextLastAction(
          {
            ...state,
            mode: action.payload.mode,
          },
          action.type,
        );
      case "input/append": {
        const nextExpression = `${state.display.expression}${action.payload.value}`;
        return nextLastAction(nextEditingState(state, nextExpression), action.type);
      }
      case "input/backspace": {
        const nextExpression = state.display.expression.slice(0, -1);
        return nextLastAction(nextEditingState(state, nextExpression), action.type);
      }
      case "input/clear": {
        if (action.payload.scope === "all") {
          return nextLastAction(
            {
              ...clearEntry(state),
              ans: null,
              history: [],
            },
            action.type,
          );
        }
        return nextLastAction(clearEntry(state), action.type);
      }
      case "engine/evaluate-request": {
        if (state.display.expression.trim().length === 0) {
          return nextLastAction(
            {
              ...state,
              display: {
                ...state.display,
                status: "error",
                errorMessage: "Expression required before evaluation.",
              },
            },
            action.type,
          );
        }
        return nextLastAction(
          {
            ...state,
            display: {
              ...state.display,
              preview: state.display.expression,
              status: "editing",
              errorMessage: null,
            },
          },
          action.type,
        );
      }
      case "engine/evaluate-success": {
        const historyEntry: HistoryEntry = {
          expression: action.payload.expression,
          result: action.payload.result,
          evaluatedAtIso: action.payload.evaluatedAtIso,
        };
        return nextLastAction(
          {
            ...state,
            ans: action.payload.result,
            history: limitHistory([historyEntry, ...state.history]),
            display: {
              expression: action.payload.expression,
              preview: action.payload.expression,
              result: action.payload.result,
              status: "evaluated",
              errorMessage: null,
            },
          },
          action.type,
        );
      }
      case "engine/evaluate-failure":
        return nextLastAction(
          {
            ...state,
            display: {
              ...state.display,
              status: "error",
              errorMessage: action.payload.message,
            },
          },
          action.type,
        );
      case "preferences/toggle-crt":
        return nextLastAction(
          {
            ...state,
            preferences: {
              ...state.preferences,
              crtScanlineEnabled: action.payload.enabled,
            },
          },
          action.type,
        );
      default: {
        const exhaustiveAction: never = action;
        return exhaustiveAction;
      }
    }
  },
});
