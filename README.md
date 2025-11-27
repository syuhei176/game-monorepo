Game Monorepo
=====

A collection of browser-based games built with different game engines.

Play demos [here](https://syuhei176.github.io/game-monorepo/).

## Games

### Reversi
Classic reversi game with AI opponent
* Game Engine: Excalibur
* Language: TypeScript
* [Play Reversi](https://syuhei176.github.io/game-monorepo/reversi/)

### BlockponJS
Breakout-style brick breaker with combo scoring system
* Game Engine: GraphicsJS
* Language: TypeScript
* [Play BlockponJS](https://syuhei176.github.io/game-monorepo/blockponjs/)

## Tech Stack

* **Monorepo**: pnpm workspaces
* **Language**: TypeScript
* **Build Tool**: Vite
* **Deployment**: GitHub Pages

## Development

```bash
# Install dependencies
pnpm install

# Run development servers
pnpm dev              # Landing page (port 3001)
pnpm dev:reversi      # Reversi game (port 3000)
pnpm dev:blockponjs   # BlockponJS game (port 3002)

# Build all packages
pnpm build

# Test
pnpm test:reversi
```

## Project Structure

```
game-monorepo/
├── games/
│   ├── reversi/       # Reversi game
│   └── blockponjs/    # BlockponJS game
├── landing/           # Landing page
└── dist/              # Build output
```

