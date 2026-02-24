export type CalculatorMode = "standard" | "scientific";

export interface CalculatorPreferences {
  readonly crtEnabled: boolean;
}

export interface CalculationHistoryEntry {
  readonly expression: string;
  readonly result: string;
  readonly evaluatedAtIso: string;
}

export interface AppState {
  readonly expression: string;
  readonly resultPreview: string | null;
  readonly errorMessage: string | null;
  readonly mode: CalculatorMode;
  readonly ans: string | null;
  readonly history: readonly CalculationHistoryEntry[];
  readonly preferences: CalculatorPreferences;
}

export const MAX_HISTORY_ENTRIES = 20;

export function createInitialState(): AppState {
  return {
    expression: "",
    resultPreview: null,
    errorMessage: null,
    mode: "scientific",
    ans: null,
    history: [],
    preferences: {
      crtEnabled: false
    }
  };
}
