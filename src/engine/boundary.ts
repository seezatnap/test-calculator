import type { CalculatorAction } from "../contracts/actions.js";
import {
  type CalculatorErrorCode,
  type CalculatorState,
  HISTORY_LIMIT
} from "../contracts/state.js";

const DEFAULT_HISTORY_TIMESTAMP = "1970-01-01T00:00:00.000Z";

export interface EngineTransition {
  readonly state: CalculatorState;
  readonly emittedActions: ReadonlyArray<CalculatorAction>;
}

export interface EvaluationRequest {
  readonly expression: string;
  readonly ans: string | null;
}

export type EvaluationResult =
  | {
      readonly ok: true;
      readonly result: string;
    }
  | {
      readonly ok: false;
      readonly code: CalculatorErrorCode;
      readonly message: string;
    };

export interface EngineModule {
  reduce(state: CalculatorState, action: CalculatorAction): EngineTransition;
  evaluate(request: EvaluationRequest): EvaluationResult;
}

export function createPassThroughEngine(): EngineModule {
  return {
    reduce(state, action) {
      switch (action.type) {
        case "app/hydrate":
          return {
            state: mergeHydratedState(state, action.state),
            emittedActions: []
          };
        case "app/set-mode":
          return {
            state: { ...state, mode: action.mode },
            emittedActions: []
          };
        case "app/set-theme":
          return {
            state: { ...state, theme: action.theme },
            emittedActions: []
          };
        case "input/clear":
          return {
            state: {
              ...state,
              expression: "",
              resultPreview: null,
              error: null
            },
            emittedActions: []
          };
        case "engine/evaluated":
          return {
            state: {
              ...state,
              expression: action.expression,
              resultPreview: action.result,
              ans: action.result,
              error: null,
              history: [
                ...state.history,
                {
                  expression: action.expression,
                  result: action.result,
                  createdAtIso:
                    action.recordedAtIso ?? DEFAULT_HISTORY_TIMESTAMP
                }
              ].slice(-HISTORY_LIMIT)
            },
            emittedActions: []
          };
        case "engine/error":
          return {
            state: {
              ...state,
              error: {
                code: action.code,
                message: action.message
              }
            },
            emittedActions: []
          };
        default:
          return {
            state,
            emittedActions: []
          };
      }
    },
    evaluate(request) {
      return {
        ok: false,
        code: "unsupported_operation",
        message: `Evaluator is not implemented for "${request.expression}".`
      };
    }
  };
}

function mergeHydratedState(
  state: CalculatorState,
  incoming: Partial<CalculatorState>
): CalculatorState {
  const nextHistory =
    incoming.history === undefined
      ? state.history
      : incoming.history.slice(-HISTORY_LIMIT);

  return {
    ...state,
    ...incoming,
    history: nextHistory
  };
}
