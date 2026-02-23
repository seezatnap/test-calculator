# PRD Phase 1: WebGL Foundation + Scientific Core

## Goal
Ship a production-ready baseline of a scientific calculator rendered in a WebGL canvas, with accurate math evaluation, keyboard support, and polished interaction feedback.

## Why this phase exists
- Establish the rendering and state architecture that all later features depend on.
- Prove that a calculator-first UX can live inside a GPU-rendered scene without sacrificing usability.

## Scope
- Single-page app with one primary `canvas` used for calculator UI rendering.
- Core expression support:
  - numbers, decimals, sign toggle, `%`
  - `+`, `-`, `*`, `/`, `^`
  - `()`, `sqrt`, `log`, `ln`, `sin`, `cos`, `tan`
- Deterministic evaluation engine with explicit operator precedence and parser errors.
- Keyboard and pointer input parity (same behavior across both paths).
- Minimal history (`ANS` + last 20 calculations).

## Technical requirements
- WebGL2 preferred, WebGL1 fallback message if unsupported.
- 60 FPS idle render loop on modern laptop hardware.
- Deterministic state machine for input/evaluation; no implicit mutation from render code.
- Use decimal-safe arithmetic strategy for common operations to reduce float surprises.
- Strongly typed app modules (TypeScript recommended).

## UX requirements
- Responsive layout for desktop and mobile.
- Visual feedback on key/button press (scale, glow, or depth pulse).
- Error states shown inline (e.g., malformed expression, divide-by-zero).
- Distinct display zones:
  - current expression
  - result preview
  - mode/status row

## Bells and whistles in this phase
- Animated "result pulse" shader sweep when calculation succeeds.
- Subtle CRT/scanline toggle theme (default off, persisted preference).
- Tap-and-hold backspace auto-repeat with acceleration.

## Architecture
- `render/`:
  - shader programs
  - geometry batches for keys/display panels
  - text atlas renderer
- `engine/`:
  - tokenizer + parser + evaluator
  - calculator state reducer
- `input/`:
  - keyboard map
  - pointer hit testing + gestures
- `app/`:
  - bootstrap
  - persistence for preferences/history

## Acceptance criteria
- All core functions produce correct results for golden test cases.
- Calculator works fully with keyboard only.
- Canvas scaling remains crisp at devicePixelRatio 1-3.
- Recovery after invalid expression is one-click (`C`) without page refresh.
- At least 40 automated tests covering parser, evaluator, and reducer logic.

## Out of scope
- Graph plotting.
- Equation solving.
- Programmer mode.
- Offline/PWA packaging.

## Definition of done
- Demo build runs locally with documented start command.
- Test suite for core math + reducer passes.
- Phase handoff note lists known limitations and extension hooks for Phase 2.
