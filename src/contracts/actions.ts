import type {
  CalculationHistoryEntry,
  CalculatorMode,
  CalculatorPreferences
} from "./state.js";

export type ActionSource = "keyboard" | "pointer" | "system" | "engine";

interface BaseAction<TType extends string, TSource extends ActionSource> {
  readonly type: TType;
  readonly source: TSource;
}

export interface InsertTextAction
  extends BaseAction<"input/insert-text", "keyboard" | "pointer"> {
  readonly text: string;
}

export interface BackspaceAction
  extends BaseAction<"input/backspace", "keyboard" | "pointer"> {}

export interface ClearAction
  extends BaseAction<"input/clear", "keyboard" | "pointer"> {}

export interface EvaluateAction
  extends BaseAction<"input/evaluate", "keyboard" | "pointer"> {}

export interface ApplyEngineResultAction
  extends BaseAction<"engine/apply-result", "engine"> {
  readonly expression: string;
  readonly result: string | null;
  readonly errorMessage: string | null;
}

export interface SetModeAction extends BaseAction<"app/set-mode", "system"> {
  readonly mode: CalculatorMode;
}

export interface ToggleCrtAction
  extends BaseAction<"app/toggle-crt", "system"> {
  readonly enabled: boolean;
}

export interface RestoreSnapshotAction
  extends BaseAction<"app/restore-snapshot", "system"> {
  readonly ans: string | null;
  readonly history: readonly CalculationHistoryEntry[];
  readonly preferences: CalculatorPreferences;
}

export type AppAction =
  | InsertTextAction
  | BackspaceAction
  | ClearAction
  | EvaluateAction
  | ApplyEngineResultAction
  | SetModeAction
  | ToggleCrtAction
  | RestoreSnapshotAction;

export type AppActionType = AppAction["type"];
