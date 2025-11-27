import "./style.css";

interface Game {
  id: string;
  name: string;
  description: string;
  engine: string;
  path: string;
}

const games: Game[] = [
  {
    id: "reversi",
    name: "Reversi",
    description: "Classic reversi game with AI opponent",
    engine: "Excalibur",
    path: "/game-monorepo/reversi/",
  },
  {
    id: "blockponjs",
    name: "BlockponJS",
    description: "Breakout-style brick breaker with combo scoring system",
    engine: "GraphicsJS",
    path: "/game-monorepo/blockponjs/",
  },
];

function renderGameList() {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  app.innerHTML = `
    <div class="container">
      <header>
        <h1>Game Collection</h1>
        <p>A collection of browser games built with different engines</p>
      </header>

      <main class="games-grid">
        ${games
          .map(
            (game) => `
          <article class="game-card">
            <div class="game-info">
              <h2>${game.name}</h2>
              <p class="description">${game.description}</p>
              <p class="engine">Engine: <strong>${game.engine}</strong></p>
            </div>
            <a href="${game.path}" class="play-button">Play Now</a>
          </article>
        `,
          )
          .join("")}
      </main>

      <footer>
        <p>Built with pnpm monorepo + Vite + TypeScript</p>
        <p>
          <a href="https://github.com/syuhei176/game-monorepo" target="_blank">
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  `;
}

renderGameList();
