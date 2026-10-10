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

Fabrika is installed, not copied into this repo. You need two things on your machine:

- The CLI. It is pinned in the root `package.json`, so `pnpm install` brings it and
  `pnpm exec fabrika --help` runs it. You can also install it globally with
  `pnpm add --global @kampus/fabrika-cli`.
- The Claude Code plugin with the skills. `.claude/settings.json` registers the `kampus`
  marketplace and turns on `fabrika@kampus`, so Claude Code offers to install it when you open
  this repo. To install it by hand: `/plugin marketplace update kampus`, then
  `/plugin install fabrika@kampus`.

`.fabrika.jsonc` holds this repo's fabrika settings. `pnpm exec fabrika status settings` shows
what each one resolves to. The setup follows fabrika's
[adoption guide](https://github.com/kamp-us/phoenix/blob/main/claude-plugins/fabrika/guide/adopt-fabrika-in-a-new-repo.md).

## Project Structure

```
fabrika-tuval/
├── apps/               # Runnable applications
│   └── [your-app]/
├── packages/           # Shared packages
│   └── [your-package]/
├── package.json        # Root workspace manifest
├── pnpm-workspace.yaml # Workspace and dependency catalog
├── .fabrika.jsonc      # Fabrika settings
└── biome.json          # Linting & formatting config
```
