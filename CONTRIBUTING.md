# Contributing

## Local setup

```bash
npm install
npm run dev
```

The first `npm install` will create `package-lock.json`; commit that lockfile with the first dependency-resolving change so local, CI and Vercel installs become reproducible.

## Branches and pull requests

Use a feature branch and open a pull request into `main`. Vercel preview deployments can follow pull requests while production remains attached to `main`.

## Required checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

For first-time Playwright setup:

```bash
npx playwright install chromium
```

See `AGENTS.md` and `docs/ARCHITECTURE.md` before changing gameplay architecture.
