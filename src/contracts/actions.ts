import type {
  CalculatorErrorCode,
  CalculatorMode,
  CalculatorState,
  ThemePreference
} from "./state.js";

export type InputSource = "keyboard" | "pointer" | "system";

export type CalculatorAction =
  | {
      readonly type: "app/bootstrap";
    }
  | {
      readonly type: "app/hydrate";
      readonly state: Partial<CalculatorState>;
    }
  | {
      readonly type: "app/set-mode";
      readonly mode: CalculatorMode;
    }
  | {
      readonly type: "app/set-theme";
      readonly theme: ThemePreference;
    }
  | {
      readonly type: "input/append-token";
      readonly token: string;
      readonly source: InputSource;
    }
  | {
      readonly type: "input/backspace";
      readonly source: InputSource;
    }
  | {
      readonly type: "input/clear";
      readonly source: InputSource;
    }
  | {
      readonly type: "engine/evaluate";
      readonly source: InputSource;
    }
  | {
      readonly type: "engine/evaluated";
      readonly expression: string;
      readonly result: string;
      readonly recordedAtIso?: string;
    }
  | {
      readonly type: "engine/error";
      readonly code: CalculatorErrorCode;
      readonly message: string;
    };

export type ActionDispatch = (action: CalculatorAction) => void;
