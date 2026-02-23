# PRD Phase 2: Scientific Depth + Precision Controls

## Goal
Expand the calculator into true scientific mode with configurable angle systems, broader function coverage, and reliable high-precision behavior.

## Why this phase exists
- Users expect complete scientific workflows, not just basic trig/log.
- This phase de-risks precision edge cases before visualization and power features land.

## Scope
- Add scientific functions:
  - inverse trig: `asin`, `acos`, `atan`
  - hyperbolic: `sinh`, `cosh`, `tanh`
  - exponentials: `exp`, `10^x`, `x^y`
  - combinatorics: `nPr`, `nCr`, factorial (integer guardrails)
- Add angle modes: `DEG`, `RAD`, `GRAD`.
- Add constants: `pi`, `e`, `phi`, `c` (speed of light), `G` (gravitational constant).
- Extend history to 100 entries with filter/search.
- Add memory bank: `M+`, `M-`, `MR`, `MC`, plus 4 named slots.

## Technical requirements
- Precision policy:
  - internal high precision for intermediate values
  - display rounded by configurable significant digits
- Function registry system so new ops can be added without parser rewrites.
- Versioned persistence schema for history/memory storage.

## UX requirements
- Compact scientific panel that can collapse on small screens.
- Mode pills for angle and precision quickly editable from the top bar.
- History drawer with instant "reuse expression" tap.
- Visual indication when result is rounded/truncated.

## Bells and whistles in this phase
- "Explain mode" toggle: show parsed expression tree and evaluation steps for the latest result.
- Smart result formatter:
  - auto-switch between decimal/scientific notation
  - engineering notation option

## Acceptance criteria
- Function outputs match trusted calculator references for a defined test matrix.
- Mode switches (`DEG/RAD/GRAD`) update trig results immediately.
- Memory slots persist between sessions and are resettable.
- At least 30 new tests focused on scientific functions and precision behavior.

## Out of scope
- Graph rendering.
- Equation solving assistant.
- Offline sync.

## Definition of done
- Scientific mode is default-capable and stable.
- Precision and formatting behavior documented for users.
- Integration points defined for plotting inputs in Phase 3.
