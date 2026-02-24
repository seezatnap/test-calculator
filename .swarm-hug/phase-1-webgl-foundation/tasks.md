# Tasks

## Delivery Foundation

- [A] (#1) Define and document Phase 1 delivery operations: preflight checks (branch alignment, artifact/run-input validation), failure triage path, human-review decision gate, and end-of-sprint rubric scoring; scaffold strongly typed module boundaries for `render/`, `engine/`, `input/`, and `app/` with shared state/action contracts [5 pts]

## Rendering & UI

- [ ] (#2) Implement single-page bootstrap with one primary calculator `canvas`, prefer WebGL2 initialization, and show explicit fallback messaging when supported context is unavailable [5 pts] (blocked by #1)
- [ ] (#3) Build responsive canvas sizing and device-pixel-ratio handling to keep rendering crisp from DPR 1 to 3 across desktop and mobile breakpoints [5 pts] (blocked by #2)
- [ ] (#4) Create rendering foundation: shader program setup, geometry batches for keys/display panels, text atlas rendering, and a stable idle render loop targeting 60 FPS without mutating app state [5 pts] (blocked by #2)
- [ ] (#5) Implement calculator UI composition inside the canvas with distinct zones for current expression, result preview, and mode/status row, plus responsive key grid layout [5 pts] (blocked by #3, #4)
- [ ] (#6) Add interaction and feedback visuals: key/button press animation (scale/glow/depth pulse), inline error-state presentation, and success-triggered result pulse shader sweep [5 pts] (blocked by #5)
- [ ] (#7) Implement CRT/scanline theme toggle (default off) in UI state and expose preference hooks for app-level persistence integration [5 pts] (blocked by #5)

## Engine & State

- [ ] (#8) Implement tokenizer and parser with deterministic grammar, explicit operator precedence/associativity for `+ - * / ^`, decimals, parentheses, and structured parser errors [5 pts] (blocked by #1)
- [ ] (#9) Implement evaluator core with deterministic execution and decimal-safe arithmetic strategy for common operations, including explicit divide-by-zero and runtime error handling [5 pts] (blocked by #8)
- [ ] (#10) Extend evaluator with scientific operations and unary behaviors: `sqrt`, `log`, `ln`, `sin`, `cos`, `tan`, sign toggle, and `%` semantics consistent with calculator UX [5 pts] (blocked by #9)
- [ ] (#11) Build deterministic calculator reducer/state machine for input, edit, evaluate, and error flows, including one-action recovery via `C` after invalid expressions and strict separation from render mutations [5 pts] (blocked by #8, #9, #10)
- [ ] (#12) Add `ANS` support and rolling history of the last 20 calculations in state model with clear retention/truncation behavior [5 pts] (blocked by #11)

## Input & App Integration

- [ ] (#13) Implement full keyboard mapping so all calculator capabilities are operable without pointer input, including functions, operators, clear, backspace, and evaluate [5 pts] (blocked by #11)
- [ ] (#14) Implement pointer input path with hit testing and gesture handling, including tap-and-hold backspace auto-repeat with acceleration, matching keyboard behavior parity [5 pts] (blocked by #5, #11)
- [ ] (#15) Integrate app bootstrap across renderer, engine, and input layers; wire persistence for preferences/history; and provide a documented local demo start command [5 pts] (blocked by #6, #7, #12, #13, #14)

## Testing & Handoff

- [ ] (#16) Build automated golden tests for tokenizer/parser/evaluator correctness across core/scientific expressions, malformed input, and numerical edge cases [5 pts] (blocked by #10)
- [ ] (#17) Build reducer-focused automated tests covering state transitions, invalid-expression recovery, `ANS`, history limits, and clear/backspace behavior to satisfy core logic coverage targets [5 pts] (blocked by #12)
- [ ] (#18) Add integration checks for keyboard-only operation, keyboard-pointer parity, and canvas crispness expectations at DPR 1-3 [5 pts] (blocked by #15, #16, #17)
- [ ] (#19) Produce Phase 1 handoff notes with known limitations and Phase 2 extension hooks, then run final rubric-based delivery grading before sign-off [5 pts] (blocked by #15, #16, #17, #18)
