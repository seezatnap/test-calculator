# Tasks

## Project Setup & Governance

- [ ] (#1) Create Phase 1 preflight checklist and automation covering source/target branch alignment, required artifact presence, and explicit run parameters, plus an escalation path for human decisions and branch drift before sprint execution [5 pts]
- [ ] (#2) Scaffold a strongly typed TypeScript single-page app with one primary calculator canvas and baseline module structure (`render/`, `engine/`, `input/`, `app/`), including documented local start/build commands and explicit exclusion of out-of-scope features from implementation [5 pts] (blocked by #1)

## Engine & State

- [ ] (#3) Implement tokenizer and parser for numbers, decimals, sign toggle, `%`, `+ - * / ^`, parentheses, and `sqrt/log/ln/sin/cos/tan` with explicit precedence rules and structured parser errors [5 pts] (blocked by #2)
- [ ] (#4) Build deterministic evaluator logic with decimal-safe arithmetic for common operations, correct function/operator execution, divide-by-zero handling, and ANS-ready evaluation hooks [5 pts] (blocked by #3)
- [ ] (#5) Implement calculator reducer/state machine that owns all input/evaluation transitions (no render-side mutation), manages expression/result preview/mode-status/error states, and supports one-click `C` recovery after invalid expressions [5 pts] (blocked by #4)
- [ ] (#6) Implement app persistence layer to store and hydrate `ANS`, rolling last 20 calculations, and UI preferences, with save-on-change integration into bootstrap and reducer flows [5 pts] (blocked by #5)

## Input Layer

- [ ] (#7) Implement keyboard mapping and normalized action dispatch so all calculator behavior works with keyboard only, including scientific functions, clear/backspace, and parity with reducer semantics [5 pts] (blocked by #5)
- [ ] (#8) Implement pointer hit-testing and gesture handling on the canvas keypad, including tap-and-hold backspace auto-repeat with acceleration, while preserving identical behavior to keyboard actions [5 pts] (blocked by #7)

## WebGL Rendering & UX

- [ ] (#9) Implement WebGL bootstrap with WebGL2-first initialization, explicit fallback message when WebGL2 is unavailable (including WebGL1-only/unsupported cases), responsive sizing, and crisp DPR 1-3 canvas scaling [5 pts] (blocked by #2)
- [ ] (#10) Build render subsystem primitives (shader programs, geometry batches, text atlas renderer) and draw the calculator layout with distinct zones for current expression, result preview, and mode/status row [5 pts] (blocked by #9)
- [ ] (#11) Wire deterministic app state to render loop targeting 60 FPS idle performance on modern laptops, and add key/button press feedback effects (scale, glow, or depth pulse) without introducing render-driven state mutation [5 pts] (blocked by #10, #5)
- [ ] (#12) Implement success animation and theming polish: result pulse shader sweep on successful calculations and CRT/scanline toggle (default off) persisted through the app preferences layer [5 pts] (blocked by #11, #6)

## Testing & Handoff

- [ ] (#13) Create automated core test suites for parser, evaluator, and reducer with golden-result coverage for all core functions/operators, malformed-expression handling, and divide-by-zero behavior, reaching at least 40 tests [5 pts] (blocked by #6)
- [ ] (#14) Add integration/QA validation for keyboard-only operation, keyboard/pointer parity, one-click `C` recovery, DPR 1-3 crispness, and idle 60 FPS verification with repeatable test procedures [5 pts] (blocked by #8, #11, #13)
- [ ] (#15) Produce Phase 1 handoff package with demo run instructions, known limitations, Phase 2 extension hooks, and sprint scoring against correctness/safety/traceability rubric criteria [5 pts] (blocked by #14)
