export const HISTORY_LIMIT = 20 as const;

export type CalculatorMode = "basic" | "scientific";
export type ThemePreference = "default" | "crt-scanline";

export type CalculatorErrorCode =
  | "parser_error"
  | "runtime_error"
  | "divide_by_zero"
  | "unsupported_operation";

export interface CalculatorError {
  readonly code: CalculatorErrorCode;
  readonly message: string;
}

export interface HistoryEntry {
  readonly expression: string;
  readonly result: string;
  readonly createdAtIso: string;
}

export interface CalculatorState {
  readonly expression: string;
  readonly resultPreview: string | null;
  readonly ans: string | null;
  readonly history: ReadonlyArray<HistoryEntry>;
  readonly mode: CalculatorMode;
  readonly theme: ThemePreference;
  readonly error: CalculatorError | null;
}
