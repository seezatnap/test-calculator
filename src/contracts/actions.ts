import type { CalculationHistoryEntry } from "./state";

export type ActionOrigin = "keyboard" | "pointer" | "system";

interface BaseAction {
  origin: ActionOrigin;
  timestampMs: number;
}

export type AppAction =
  | (BaseAction & { type: "input/append-token"; token: string })
  | (BaseAction & { type: "input/backspace" })
  | (BaseAction & { type: "input/clear"; scope: "entry" | "all" })
  | (BaseAction & { type: "engine/evaluate" })
  | (BaseAction & {
      type: "engine/evaluation-success";
      normalizedExpression: string;
      value: string;
    })
  | (BaseAction & {
      type: "engine/evaluation-error";
      code: "parse_error" | "runtime_error" | "divide_by_zero";
      message: string;
    })
  | (BaseAction & { type: "preferences/toggle-crt" })
  | (BaseAction & {
      type: "history/hydrate";
      entries: ReadonlyArray<CalculationHistoryEntry>;
      ans: string | null;
    });

export const isSystemAction = (action: AppAction): boolean => action.origin === "system";
