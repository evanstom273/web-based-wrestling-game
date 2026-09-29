# Architecture

## Purpose

The project is intentionally split so the wrestling game can become large without coupling rules to a specific renderer or UI framework.

```text
React + Tailwind application UI
              │
              ▼
      Zustand bridge/state
              │
              ▼
   Plain TypeScript match engine
      │        │         │
      │        │         └─ AI / rules / move data
      │        └────────── fixed-step simulation
      ▼
 R3F / Three.js presentation
              │
              ▼
       Rapier spatial world
              │
              ▼
            WebGL
```

## Ownership

### `src/app`

Application shell and route-level composition. It may subscribe to stores and render UI, but it must not own wrestling formulas.

### `src/game/engine`

Authoritative domain state and pure match logic. This is where rules must ultimately live. It should remain runnable in Vitest without a browser or renderer.

### `src/game/state`

Small Zustand stores that bridge application input and render/UI state. Keep match-domain rules out of stores.

### `src/game/scene`

R3F/Three presentation, procedural geometry, cameras, lights and visual animation. Scene components render state and report intents; they do not decide authoritative outcomes.

### Rapier

Rapier is present from the foundation. The intended boundary is spatial reality: colliders, ring edges, environmental objects, impacts, weapons and future ragdoll/secondary motion. Controlled wrestling choreography and match results remain engine decisions.

## Time model

The final match simulation should use a fixed timestep. Rendering may interpolate and run at display refresh rate. Never calculate authoritative damage, pin timing or AI decisions directly from variable render delta.

## Procedural art

The preferred asset model is data -> generator -> geometry/materials. Examples:

- Wrestler definition -> body proportions, gear geometry, colours, hair/facial-hair primitives.
- Ring definition -> dimensions, ropes, posts, turnbuckles, apron and branding.
- Arena definition -> seating/crowd/lighting composition.
- Move definition -> authored phases consumed by reusable procedural animation logic.

This does not ban external assets. It prevents the game from depending on them to have a coherent visual identity.

## Responsive/orientation contract

The game targets desktop, landscape phones, tablets and unfolded foldables. Pixel 10 Pro Fold inner-screen use is a primary foldable reference case.

Phone portrait is intentionally unsupported for active gameplay. A narrow portrait viewport must show a rotate-device gate rather than squeeze the match UI into portrait. Square-ish and near-square unfolded foldable layouts remain supported and must not be rejected by a simplistic portrait check.

Safe areas, touch input and practical touch targets are part of the layout contract.

## Testing layers

- **Vitest:** domain rules and deterministic simulation.
- **Playwright:** browser boot, menus, input, responsive flows and rendering smoke tests across desktop Chromium, a landscape-phone viewport and a touch-enabled unfolded-foldable viewport. Portrait-phone coverage verifies the rotate-device gate.
- **GitHub Actions:** formatting, lint, typecheck, unit tests, production build and browser smoke tests on every PR/main push.

## Dependency policy

Core stack dependencies are deliberate. New dependencies need a clear reason and must not duplicate functionality already owned by the stack.
