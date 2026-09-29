# Control direction

The initial in-match control layout takes inspiration from the compact, contextual control philosophy used by MDickie's wrestling games.

## Mobile / touch layout

- Left side: one movement pad.
- Right side: six semantic action inputs.
  - **A** — Attack
  - **G** — Grapple
  - **R** — Run
  - **P** — Pick Up
  - **T** — Taunt / Pin
  - **Focus** — Target/focus control

The buttons are intentionally semantic rather than one-button-per-move. Their eventual gameplay meaning should depend on wrestler state, opponent state, direction, ring area, motion and context.

The current buttons are presentation-only. Wiring them to the input layer comes next.

## Camera direction

The default match camera is no longer an orbit/debug camera. It sits behind and above the player wrestler, looking through the ring toward the opponent. The goal is a third-person wrestling-game perspective without becoming a literal shoulder camera.

The gameplay camera should remain authored by the game. Debug/free-camera behavior, if retained, belongs behind a deliberate debug mode rather than being the default player view.
