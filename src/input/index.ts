import { AppAction, AppDispatch } from "../contracts";

export interface InputAdapter {
  readonly module: "input";
  attach(dispatch: AppDispatch): void;
  detach(): void;
  mapKeyboardKey(key: string): AppAction | null;
  mapPointerToken(token: string): AppAction | null;
  emitKeyboardKey(key: string): void;
  emitPointerToken(token: string): void;
}

const appendableKeys = new Set<string>([
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  ".",
  "+",
  "-",
  "*",
  "/",
  "^",
  "%",
  "(",
  ")",
]);

const pointerAppendMap: Record<string, string> = {
  sqrt: "sqrt(",
  log: "log(",
  ln: "ln(",
  sin: "sin(",
  cos: "cos(",
  tan: "tan(",
  ANS: "ANS",
};

const keyboardShortcutMap: Record<string, string> = {
  a: "ANS",
  l: "log(",
  n: "ln(",
  q: "sqrt(",
  s: "sin(",
  o: "cos(",
  t: "tan(",
};

const toAppendAction = (value: string, source: "keyboard" | "pointer"): AppAction => ({
  type: "input/append",
  payload: {
    value,
    source,
  },
});

export const createInputAdapter = (): InputAdapter => {
  let dispatchRef: AppDispatch | null = null;

  const mapKeyboardKey = (key: string): AppAction | null => {
    if (appendableKeys.has(key)) {
      return toAppendAction(key, "keyboard");
    }
    if (key === "Enter" || key === "=") {
      return {
        type: "engine/evaluate-request",
        payload: { source: "keyboard" },
      };
    }
    if (key === "Backspace") {
      return {
        type: "input/backspace",
        payload: { source: "keyboard" },
      };
    }
    if (key === "Escape" || key.toLowerCase() === "c") {
      return {
        type: "input/clear",
        payload: { source: "keyboard", scope: "all" },
      };
    }
    const shortcutValue = keyboardShortcutMap[key.toLowerCase()];
    if (shortcutValue) {
      return toAppendAction(shortcutValue, "keyboard");
    }
    return null;
  };

  const mapPointerToken = (token: string): AppAction | null => {
    if (token === "=") {
      return {
        type: "engine/evaluate-request",
        payload: { source: "pointer" },
      };
    }
    if (token === "C") {
      return {
        type: "input/clear",
        payload: { source: "pointer", scope: "all" },
      };
    }
    if (token === "CE") {
      return {
        type: "input/clear",
        payload: { source: "pointer", scope: "entry" },
      };
    }
    if (token === "⌫") {
      return {
        type: "input/backspace",
        payload: { source: "pointer", repeating: false },
      };
    }
    if (appendableKeys.has(token)) {
      return toAppendAction(token, "pointer");
    }
    const pointerValue = pointerAppendMap[token];
    if (pointerValue) {
      return toAppendAction(pointerValue, "pointer");
    }
    return null;
  };

  const emitAction = (action: AppAction | null): void => {
    if (dispatchRef && action) {
      dispatchRef(action);
    }
  };

  return {
    module: "input",
    attach(dispatch: AppDispatch): void {
      dispatchRef = dispatch;
    },
    detach(): void {
      dispatchRef = null;
    },
    mapKeyboardKey,
    mapPointerToken,
    emitKeyboardKey(key: string): void {
      emitAction(mapKeyboardKey(key));
    },
    emitPointerToken(token: string): void {
      emitAction(mapPointerToken(token));
    },
  };
};
