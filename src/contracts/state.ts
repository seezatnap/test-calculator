export type AngleUnit = "deg" | "rad";
export type CalculatorMode = "standard" | "scientific";
export type EvaluationStatus = "idle" | "editing" | "evaluated" | "error";

export interface CalculationHistoryEntry {
  expression: string;
  result: string;
  evaluatedAtIso: string;
}

export interface UserPreferences {
  crtScanlineEnabled: boolean;
  angleUnit: AngleUnit;
}

export interface AppState {
  expression: string;
  resultPreview: string | null;
  ans: string | null;
  mode: CalculatorMode;
  status: EvaluationStatus;
  errorMessage: string | null;
  history: CalculationHistoryEntry[];
  preferences: UserPreferences;
}

export const createInitialAppState = (): AppState => ({
  expression: "",
  resultPreview: null,
  ans: null,
  mode: "scientific",
  status: "idle",
  errorMessage: null,
  history: [],
  preferences: {
    crtScanlineEnabled: false,
    angleUnit: "deg"
  }
});
