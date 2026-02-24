import type {
  AppAction,
  ApplyEngineResultAction
} from "../contracts/actions.js";
import {
  MAX_HISTORY_ENTRIES,
  type AppState,
  type CalculationHistoryEntry
} from "../contracts/state.js";

export interface EngineEvaluationRequest {
  readonly expression: string;
  readonly ans: string | null;
}

export interface EngineEvaluationResult {
  readonly ok: boolean;
  readonly result: string | null;
  readonly errorMessage: string | null;
}

export interface EngineModule {
  readonly module: "engine";
  evaluate(request: EngineEvaluationRequest): EngineEvaluationResult;
  reduce(state: AppState, action: AppAction): AppState;
}

function limitHistory(
  history: readonly CalculationHistoryEntry[]
): readonly CalculationHistoryEntry[] {
  if (history.length <= MAX_HISTORY_ENTRIES) {
    return [...history];
  }

  return history.slice(history.length - MAX_HISTORY_ENTRIES);
}

function appendHistory(
  history: readonly CalculationHistoryEntry[],
  entry: CalculationHistoryEntry
): readonly CalculationHistoryEntry[] {
  return limitHistory([...history, entry]);
}

function evaluateExpression(
  request: EngineEvaluationRequest
): EngineEvaluationResult {
  const trimmedExpression = request.expression.trim();

  if (trimmedExpression.length === 0) {
    return {
      ok: false,
      result: null,
      errorMessage: "Expression is empty."
    };
  }

  if (trimmedExpression === "ANS") {
    if (request.ans === null) {
      return {
        ok: false,
        result: null,
        errorMessage: "ANS is not available yet."
      };
    }

    return {
      ok: true,
      result: request.ans,
      errorMessage: null
    };
  }

  const parsedNumber = Number(trimmedExpression);

  if (Number.isFinite(parsedNumber)) {
    return {
      ok: true,
      result: String(parsedNumber),
      errorMessage: null
    };
  }

  return {
    ok: false,
    result: null,
    errorMessage: "Expression parser/evaluator is scaffolded but not implemented."
  };
}

function applyEngineResult(
  state: AppState,
  action: ApplyEngineResultAction
): AppState {
  if (action.errorMessage !== null || action.result === null) {
    return {
      ...state,
      resultPreview: null,
      errorMessage: action.errorMessage ?? "Unknown engine error."
    };
  }

  const historyEntry: CalculationHistoryEntry = {
    expression: action.expression,
    result: action.result,
    evaluatedAtIso: new Date().toISOString()
  };

  return {
    ...state,
    expression: action.result,
    resultPreview: action.result,
    errorMessage: null,
    ans: action.result,
    history: appendHistory(state.history, historyEntry)
  };
}

export function createEngineModule(): EngineModule {
  return {
    module: "engine",
    evaluate(request) {
      return evaluateExpression(request);
    },
    reduce(state, action) {
      switch (action.type) {
        case "input/insert-text":
          return {
            ...state,
            expression: `${state.expression}${action.text}`,
            errorMessage: null
          };

        case "input/backspace":
          return {
            ...state,
            expression: state.expression.slice(0, -1),
            errorMessage: null
          };

        case "input/clear":
          return {
            ...state,
            expression: "",
            resultPreview: null,
            errorMessage: null
          };

        case "input/evaluate": {
          const evaluation = evaluateExpression({
            expression: state.expression,
            ans: state.ans
          });

          return applyEngineResult(state, {
            type: "engine/apply-result",
            source: "engine",
            expression: state.expression,
            result: evaluation.result,
            errorMessage: evaluation.errorMessage
          });
        }

        case "engine/apply-result":
          return applyEngineResult(state, action);

        case "app/set-mode":
          return {
            ...state,
            mode: action.mode
          };

        case "app/toggle-crt":
          return {
            ...state,
            preferences: {
              ...state.preferences,
              crtEnabled: action.enabled
            }
          };

        case "app/restore-snapshot":
          return {
            ...state,
            ans: action.ans,
            history: limitHistory(action.history),
            preferences: {
              ...action.preferences
            }
          };

        default:
          return state;
      }
    }
  };
}
