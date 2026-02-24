export type InputSource = "keyboard" | "pointer" | "system";
export type CalculatorMode = "standard" | "scientific";
export type DisplayStatus = "idle" | "editing" | "evaluated" | "error";

export type AppActionType =
  | "app/hydrate"
  | "app/set-mode"
  | "input/append"
  | "input/backspace"
  | "input/clear"
  | "engine/evaluate-request"
  | "engine/evaluate-success"
  | "engine/evaluate-failure"
  | "preferences/toggle-crt";

export interface DisplayModel {
  expression: string;
  preview: string;
  result: string;
  status: DisplayStatus;
  errorMessage: string | null;
}

export interface HistoryEntry {
  expression: string;
  result: string;
  evaluatedAtIso: string;
}

export interface Preferences {
  crtScanlineEnabled: boolean;
}

export interface AppState {
  mode: CalculatorMode;
  display: DisplayModel;
  ans: string | null;
  history: readonly HistoryEntry[];
  preferences: Preferences;
  lastActionType: AppActionType | null;
}

export interface AppHydrationPayload {
  mode?: CalculatorMode;
  display?: Partial<DisplayModel>;
  ans?: string | null;
  history?: readonly HistoryEntry[];
  preferences?: Partial<Preferences>;
}

export type AppAction =
  | { type: "app/hydrate"; payload: AppHydrationPayload }
  | { type: "app/set-mode"; payload: { mode: CalculatorMode } }
  | { type: "input/append"; payload: { value: string; source: InputSource } }
  | { type: "input/backspace"; payload: { source: InputSource; repeating?: boolean } }
  | { type: "input/clear"; payload: { source: InputSource; scope: "entry" | "all" } }
  | { type: "engine/evaluate-request"; payload: { source: InputSource } }
  | {
      type: "engine/evaluate-success";
      payload: { expression: string; result: string; evaluatedAtIso: string };
    }
  | {
      type: "engine/evaluate-failure";
      payload: { code: "parse" | "runtime" | "divide-by-zero"; message: string };
    }
  | { type: "preferences/toggle-crt"; payload: { enabled: boolean } };

export type AppDispatch = (action: AppAction) => void;

export const HISTORY_LIMIT = 20;

export const createInitialState = (): AppState => ({
  mode: "scientific",
  display: {
    expression: "",
    preview: "",
    result: "0",
    status: "idle",
    errorMessage: null,
  },
  ans: null,
  history: [],
  preferences: {
    crtScanlineEnabled: false,
  },
  lastActionType: null,
});

export const limitHistory = (history: readonly HistoryEntry[]): readonly HistoryEntry[] =>
  history.slice(0, HISTORY_LIMIT);
