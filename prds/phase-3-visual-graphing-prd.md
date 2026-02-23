# PRD Phase 3: WebGL Visualization + Graphing Layer

## Goal
Introduce a graphing-capable visualization layer in the same WebGL canvas, letting users inspect functions and connect numeric output to visual intuition.

## Why this phase exists
- Graphing is the most differentiating feature for a WebGL calculator experience.
- This phase leverages the GPU pipeline built in Phase 1 for intentional visual depth.

## Scope
- Graph panel toggle (split view or overlay mode).
- 2D plotting of user-entered functions `y = f(x)`.
- Multiple traces (up to 3 concurrent functions).
- Pan/zoom with mouse wheel + touch gestures.
- Crosshair readout with coordinate snapping.
- Domain/window presets (standard, trig-friendly, logarithmic-friendly).

## Technical requirements
- Dedicated graph render pass in WebGL.
- Adaptive sampling strategy to avoid jagged curves and preserve performance.
- Safe parser path for plotting (guard against invalid/expensive expressions).
- Shared symbol table with calculator engine (`ANS`, constants, mode).

## UX requirements
- Clear visual separation between keypad, display, and graph area.
- One-tap "send function from expression" workflow.
- Graph legend with per-trace color and visibility toggles.
- Reset view and fit-to-data actions.

## Bells and whistles in this phase
- Animated trace draw-in on first render.
- Optional heat-grid background shader reacting to zoom level.
- "Trace playback" slider to reveal curve progressively for teaching demos.

## Acceptance criteria
- Plotting remains interactive (target 45+ FPS while panning common functions).
- Singularities/discontinuities handled gracefully (no catastrophic line bridging).
- Graphs can be cleared, updated, and re-rendered without stale artifacts.
- At least 20 tests for plotting-domain validation and trace math sampling.

## Out of scope
- 3D graphing.
- CAS symbolic manipulation.
- Export/share workflows.

## Definition of done
- Users can evaluate and graph from the same expression loop.
- Visual layer is stable across desktop/mobile viewports.
- Performance notes captured for optimization pass in Phase 5.
