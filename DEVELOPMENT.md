# Development Guide

## Setup

### Prerequisites

- Node.js 26.2.0 (or compatible; managed via Volta)
- pnpm 10.27.0

### Initial Setup

```bash
git clone https://github.com/[your-username]/fabrika-tuval.git
cd fabrika-tuval
pnpm install
```

## Development Workflow

### Running Apps

Start development servers for all apps:

```bash
pnpm dev
```

### Building

Build all packages and apps:

```bash
pnpm build
```

### Type Checking

Check TypeScript types across the workspace:

```bash
pnpm typecheck
```

### Linting & Formatting

Lint and format code with Biome:

```bash
pnpm lint
pnpm format
```

## Creating a New App

1. Create a new directory under `apps/`:

```bash
mkdir apps/my-app
cd apps/my-app
```

2. Create a `package.json`:

```json
{
  "name": "@tuval/my-app",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "echo 'Add your dev command'",
    "build": "echo 'Add your build command'",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

   Every dependency is a `catalog:` reference. Add any version that is not in the `catalog:`
   block of `pnpm-workspace.yaml` there first; fabrika's catalog guard checks this.

3. Create `tsconfig.json` and source files

## Working with Fabrika

The fabrika CLI comes in with `pnpm install`, pinned in the root `package.json`:

```bash
pnpm exec fabrika --help
pnpm exec fabrika status settings
```

The skills come from the `fabrika@kampus` Claude Code plugin, which `.claude/settings.json` turns
on for this repo. See "Using Fabrika" in the README.

## Troubleshooting

### pnpm install fails

Clear cache and reinstall:

```bash
rm -rf node_modules .pnpm-store pnpm-lock.yaml
pnpm install
```

### Type errors after dependency updates

Regenerate types and rebuild:

```bash
pnpm clean
pnpm install
pnpm build
```
