# PRD Phase 4: Power Tools, Solver, and Expert Workflows

## Goal
Add expert-oriented capabilities that move the product from a calculator to a compact computational workbench.

## Why this phase exists
- Advanced users need repeatable workflows, not just one-off calculations.
- This phase introduces high-value tools while reusing the stabilized engine/graph architecture.

## Scope
- Equation solver module:
  - linear equations
  - quadratic equations (real/complex outputs)
  - numeric root finder for custom single-variable expressions
- Matrix mini-mode:
  - 2x2 and 3x3 matrix input
  - determinant, inverse, multiplication
- Programmer mini-mode:
  - BIN/OCT/DEC/HEX conversion
  - bitwise ops (`AND`, `OR`, `XOR`, `NOT`, shifts)
- Macro slots:
  - record expression templates
  - replay with parameter placeholders

## Technical requirements
- Plugin-style feature modules mounted into shared reducer/state.
- Input validation and guardrails for solver divergence/timeouts.
- Deterministic computational caps to prevent UI lockups.

## UX requirements
- Mode switcher with clear context and easy return to standard view.
- Scratchpad panel for temporary notes/equations.
- Non-blocking progress/status indicators for heavier computations.

## Bells and whistles in this phase
- Command palette (`Ctrl/Cmd+K`) to jump between actions/modes.
- Context-aware suggestions (e.g., "convert to HEX", "solve for x", "plot this").
- Quick compare card showing outputs in multiple representations.

## Acceptance criteria
- Solver returns validated results for canonical test equations.
- Matrix operations match trusted reference outputs.
- Programmer mode conversions are reversible and tested.
- At least 35 tests across solver, matrix, and bitwise features.

## Out of scope
- Full symbolic algebra system.
- Arbitrary-size matrices.
- Scripting language support.

## Definition of done
- Power tools are discoverable without cluttering base calculator UX.
- Long-running tasks fail safely with actionable error messaging.
- Phase 5 hardening checklist updated with new risk areas.
