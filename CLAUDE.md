# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a pnpm monorepo containing multiple browser-based games built with different game engines. The repository is deployed to GitHub Pages at `https://syuhei176.github.io/game-monorepo/`.

## Monorepo Structure

This uses pnpm workspaces defined in `pnpm-workspace.yaml`:
- `games/*` - Individual game packages (currently: reversi)
- `landing` - Landing page that lists all available games

Each game is a separate package with its own dependencies and build configuration. Games can use different engines (Excalibur, Pixi.js, Three.js, etc.).

## Essential Commands

```bash
# Install all dependencies
pnpm install

# Development
pnpm dev              # Run landing page dev server (port 3001)
pnpm dev:reversi      # Run reversi game dev server (port 3000)

# Build
pnpm build            # Build all packages (landing + all games)

# Testing
pnpm test:reversi     # Run reversi tests (builds first, then runs @excaliburjs/testing)
```

## Build Output Structure

All packages build to a unified `dist/` directory at the repository root:

```
dist/
├── index.html           # Landing page
├── assets/              # Landing page assets
└── reversi/             # Reversi game
    ├── index.html
    └── assets/
```

This structure is critical for GitHub Pages deployment where the landing page is served at `/game-monorepo/` and games at `/game-monorepo/{game-name}/`.

## Vite Configuration Architecture

Each package has a `vite.config.ts` with specific settings:

**Landing (`landing/vite.config.ts`):**
- `base: '/game-monorepo/'` - Root path for GitHub Pages
- `outDir: '../dist'` - Builds directly to root dist/
- `emptyOutDir: true` - Clears dist/ on build

**Games (e.g., `games/reversi/vite.config.ts`):**
- `base: '/game-monorepo/{game-name}/'` - Subpath for the game
- `outDir: '../../dist/{game-name}'` - Builds to dist/{game-name}/
- `emptyOutDir: true` - Clears only its subdirectory
- `assetsInclude: ['**/*.png', '**/*.jpg', '**/*.bmp']` - For game assets

The `base` path MUST match the GitHub Pages repository name for correct asset loading.

## Adding a New Game

1. Create directory: `games/{game-name}/`
2. Create `package.json` with:
   - `name: "{game-name}"`
   - `type: "module"`
   - Scripts: `dev`, `build`, `preview`
3. Create `vite.config.ts` with:
   - `base: '/game-monorepo/{game-name}/'`
   - `outDir: '../../dist/{game-name}'`
4. Add game to `landing/src/main.ts` games array:
   ```typescript
   {
     id: '{game-name}',
     name: 'Display Name',
     description: 'Game description',
     engine: 'Engine Name',
     path: '/game-monorepo/{game-name}/'
   }
   ```
5. Run `pnpm install && pnpm build` to verify

## TypeScript Configuration

Games may have relaxed TypeScript settings (`strict: false`) to accommodate existing game code. The landing page uses strict mode. This is intentional - prioritize working builds over strict type checking for games.

## GitHub Actions Deployment

Workflow: `.github/workflows/static.yml`
- Triggers on push to `main` branch
- Uses pnpm v8 and Node.js 20
- Runs `pnpm build` to build all packages
- Deploys `dist/` directory to GitHub Pages
- Uses latest artifact actions (v3+) to avoid deprecation warnings

## Repository Name Dependency

The repository name `game-monorepo` is hardcoded in:
- All `vite.config.ts` files (`base` setting)
- `landing/src/main.ts` (game paths)

If renaming the repository, update all these references to match the new name.
