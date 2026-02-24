import type { AppAction, AppState } from "../contracts";

export type EngineErrorCode = "parse_error" | "runtime_error" | "divide_by_zero";

export type EngineEvaluationResult =
  | { ok: true; value: string; normalizedExpression: string }
  | { ok: false; code: EngineErrorCode; message: string };

export interface EngineEvaluationContext {
  ans: string | null;
  angleUnit: AppState["preferences"]["angleUnit"];
}

export interface EngineModule {
  reduce(currentState: Readonly<AppState>, action: AppAction): AppState;
  evaluate(expression: string, context: EngineEvaluationContext): EngineEvaluationResult;
}

export const createNoopEngineModule = (): EngineModule => ({
  reduce: (state) => ({
    ...state,
    history: [...state.history],
    preferences: { ...state.preferences }
  }),
  evaluate: () => ({
    ok: false,
    code: "runtime_error",
    message: "No engine implementation has been registered."
  })
});
