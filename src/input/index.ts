import type { AppAction } from "../contracts/actions.js";

export interface InputSignal {
  readonly source: "keyboard" | "pointer";
  readonly key: string;
}

export interface InputModule {
  readonly module: "input";
  translate(signal: InputSignal): readonly AppAction[];
}

const INSERTABLE_KEYS = new Set<string>([
  "+",
  "-",
  "*",
  "/",
  "^",
  "(",
  ")",
  ".",
  "%"
]);

function normalizeKey(rawKey: string): string {
  switch (rawKey) {
    case "×":
      return "*";
    case "÷":
      return "/";
    case "−":
      return "-";
    case "Enter":
      return "=";
    default:
      return rawKey;
  }
}

export function createInputModule(): InputModule {
  return {
    module: "input",
    translate(signal) {
      const normalizedKey = normalizeKey(signal.key);
      const uppercaseKey = normalizedKey.toUpperCase();

      if (normalizedKey === "=") {
        return [{ type: "input/evaluate", source: signal.source }];
      }

      if (normalizedKey === "Backspace") {
        return [{ type: "input/backspace", source: signal.source }];
      }

      if (normalizedKey === "Escape" || uppercaseKey === "C") {
        return [{ type: "input/clear", source: signal.source }];
      }

      if (uppercaseKey === "MODE") {
        return [
          {
            type: "app/set-mode",
            source: "system",
            mode: "scientific"
          }
        ];
      }

      if (uppercaseKey === "CRT_ON") {
        return [
          {
            type: "app/toggle-crt",
            source: "system",
            enabled: true
          }
        ];
      }

      if (uppercaseKey === "CRT_OFF") {
        return [
          {
            type: "app/toggle-crt",
            source: "system",
            enabled: false
          }
        ];
      }

      if (uppercaseKey === "ANS") {
        return [
          {
            type: "input/insert-text",
            source: signal.source,
            text: "ANS"
          }
        ];
      }

      if (/^[0-9]$/.test(normalizedKey) || INSERTABLE_KEYS.has(normalizedKey)) {
        return [
          {
            type: "input/insert-text",
            source: signal.source,
            text: normalizedKey
          }
        ];
      }

      return [];
    }
  };
}
