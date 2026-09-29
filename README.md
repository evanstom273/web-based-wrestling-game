# Web-Based Wrestling Game

A code-driven 3D professional-wrestling game for the browser.

The project starts with the full production foundation rather than a throwaway prototype stack:

- Vite
- React
- TypeScript
- Tailwind CSS
- Three.js / WebGL
- React Three Fiber
- Drei
- Rapier physics
- Zustand
- Vitest
- Playwright
- ESLint + Prettier
- GitHub Actions
- Vercel-ready production build

## Current foundation

The initial scene deliberately proves the architecture is alive: a procedural ring, two procedural wrestlers, Three/R3F rendering, a Rapier physics world, Zustand-driven physics debug state and responsive React/Tailwind UI.

No imported wrestler or ring models are required.

## Development

```bash
npm install
npm run dev
```

Then open the local Vite URL.

Useful commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run validate
```

Install Playwright's browser once before local E2E testing:

```bash
npx playwright install chromium
```

## Architecture

Read [`AGENTS.md`](./AGENTS.md) and [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) before substantial implementation work.

The short version:

- React/Tailwind own application UI.
- Plain TypeScript owns authoritative wrestling simulation.
- R3F/Three own 3D presentation.
- Rapier owns spatial physics/collision.
- Zustand bridges state but is not the match engine.
- Programmatic/procedural 3D art is the default visual pipeline.

## Deployment

`vercel.json` explicitly configures the Vite build. `main` is intended for production; feature branches/PRs are intended for preview deployments.
