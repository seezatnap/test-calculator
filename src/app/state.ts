import type { CalculatorState } from "../contracts/state.js";

export function createInitialCalculatorState(): CalculatorState {
  return {
    expression: "",
    resultPreview: null,
    ans: null,
    history: [],
    mode: "scientific",
    theme: "default",
    error: null
  };
}
