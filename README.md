# fabrika-tuval

App development with Fabrika.

Each runnable app lives under `apps/`; shared packages live under `packages/`.

## Quick Start

```bash
pnpm install
pnpm dev
```

## Commands

- `pnpm dev` — Start all apps in development mode
- `pnpm build` — Build all apps
- `pnpm test` — Run tests
- `pnpm typecheck` — Type check all packages
- `pnpm lint` — Lint code
- `pnpm format` — Format code

## Using Fabrika

Fabrika is used as a build and deployment tool. See `packages/fabrika-cli` documentation or run:

```bash
pnpm exec fabrika --help
```

## Project Structure

```
fabrika-tuval/
├── apps/               # Runnable applications
│   └── [your-app]/
├── packages/           # Shared packages
│   └── [your-package]/
├── package.json        # Root workspace manifest
├── pnpm-workspace.yaml # Workspace configuration
└── biome.json          # Linting & formatting config
```
