# Tasks

## Project Setup & Architecture

- [ ] (#1) Set up the Phase 1 codebase foundation as a strongly typed TypeScript single-page app with `render/`, `engine/`, `input/`, and `app/` modules, documented local start/build commands, and preflight checks for branch drift between `main` and `feature/phase-1-webgl-foundation` [5 pts]
- [ ] (#2) Implement app bootstrap and deterministic state flow so render code consumes state snapshots only (no implicit mutation from render path) [5 pts] (blocked by #1)
- [ ] (#3) Implement WebGL initialization with WebGL2 preference, unsupported fallback messaging, and devicePixelRatio-aware canvas lifecycle/resizing [5 pts] (blocked by #1)

## Math Engine & State Management

- [ ] (#4) Build tokenizer and parser for Phase 1 expression grammar: numbers, decimals, sign toggle semantics, `%`, `+`, `-`, `*`, `/`, `^`, `()`, `sqrt`, `log`, `ln`, `sin`, `cos`, `tan`, with explicit precedence and structured parser errors [5 pts] (blocked by #1)
- [ ] (#5) Build deterministic evaluator with decimal-safe handling for common arithmetic, function evaluation, and consistent domain/divide-by-zero error behavior [5 pts] (blocked by #4)
- [ ] (#6) Implement calculator reducer/state machine for input, edit, evaluate, clear, result preview, and one-click `C` recovery after invalid expressions [5 pts] (blocked by #5)
- [ ] (#7) Implement history subsystem with `ANS` plus last 20 calculations, including deterministic insertion/overwrite rules and reducer integration [5 pts] (blocked by #6)

## Input Systems

- [ ] (#8) Implement full keyboard mapping for all calculator actions/functions, routed through a shared action dispatcher to guarantee keyboard-only operability [5 pts] (blocked by #6)
- [ ] (#9) Implement pointer hit testing and gesture handling on canvas buttons, including tap-and-hold backspace auto-repeat with acceleration, routed through the same dispatcher as keyboard input [5 pts] (blocked by #6)

## Rendering & UX

- [ ] (#10) Build rendering foundation with shader program management, geometry batching for keys/display panels, and text atlas rendering for calculator text [5 pts] (blocked by #3)
- [ ] (#11) Implement responsive layout for desktop/mobile with distinct display zones (current expression, result preview, mode/status row), key grid metrics, and resize/orientation recomputation of hit regions [5 pts] (blocked by #10)
- [ ] (#12) Implement interaction feedback visuals for key/button press (scale, glow, or depth pulse) and inline error state rendering tied to reducer/input state [5 pts] (blocked by #6, #8, #9, #11)
- [ ] (#13) Implement successful-calculation result pulse shader sweep and CRT/scanline theme overlay toggle (default off) in the render pipeline [5 pts] (blocked by #10)

## Persistence, Integration & Performance

- [ ] (#14) Implement persistence for preferences/history (CRT toggle, `ANS`, last 20 calculations) with startup rehydration and corrupted-data fallback [5 pts] (blocked by #7, #13)
- [ ] (#15) Integrate engine, input, render, and app layers into one end-to-end flow with guaranteed keyboard/pointer parity and recovery via `C` without page refresh [5 pts] (blocked by #2, #8, #9, #12, #14)
- [ ] (#16) Optimize and validate runtime quality: 60 FPS idle target on modern laptops, crisp canvas scaling at devicePixelRatio 1-3, and graceful behavior when WebGL2 is unavailable [5 pts] (blocked by #15)

## Testing & Handoff

- [ ] (#17) Create automated parser/evaluator golden tests covering all core operators/functions and explicit error cases (malformed expression, divide-by-zero, domain errors) [5 pts] (blocked by #5)
- [ ] (#18) Create automated reducer/input/history tests for keyboard vs pointer parity, `C` recovery, `ANS` and last-20 behavior, and backspace auto-repeat acceleration; ensure combined core coverage reaches at least 40 tests [5 pts] (blocked by #7, #8, #9, #17)
- [ ] (#19) Prepare Phase 1 handoff package with documented local demo command, passing test evidence, known limitations, Phase 2 extension hooks, and rubric-based sprint grading summary [5 pts] (blocked by #16, #18)
