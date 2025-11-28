import { AICallback, ReverseMap, ReverseMapState } from ".";

const POSITION_WEIGHTS = [
  [100, -20, 10, 5, 5, 10, -20, 100],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [10, -2, 5, 1, 1, 5, -2, 10],
  [5, -2, 1, 0, 0, 1, -2, 5],
  [5, -2, 1, 0, 0, 1, -2, 5],
  [10, -2, 5, 1, 1, 5, -2, 10],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [100, -20, 10, 5, 5, 10, -20, 100]
];

function cloneMap(map: ReverseMap): ReverseMap {
  const newMap = new ReverseMap(() => {});
  newMap.data = [...map.data];
  newMap.current_color = map.current_color;
  return newMap;
}

function evaluatePosition(map: ReverseMap, color: ReverseMapState): number {
  let score = 0;
  let myPieces = 0;
  let opponentPieces = 0;
  let myMobility = 0;
  let opponentMobility = 0;

  const opponentColor = color === ReverseMapState.BLACK ? ReverseMapState.WHITE : ReverseMapState.BLACK;

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const cellColor = map.get_color(i, j);

      if (cellColor === color) {
        myPieces++;
        score += POSITION_WEIGHTS[j][i];
      } else if (cellColor === opponentColor) {
        opponentPieces++;
        score -= POSITION_WEIGHTS[j][i];
      }

      if (map.check(i, j, color)) {
        myMobility++;
      }
      if (map.check(i, j, opponentColor)) {
        opponentMobility++;
      }
    }
  }

  let mobilityScore = 0;
  if (myMobility + opponentMobility > 0) {
    mobilityScore = 100 * (myMobility - opponentMobility) / (myMobility + opponentMobility);
  }

  const totalPieces = myPieces + opponentPieces;
  const gamePhase = totalPieces / 64;

  if (gamePhase > 0.8) {
    const pieceScore = (myPieces - opponentPieces) * 50;
    return score * 0.3 + mobilityScore * 0.2 + pieceScore * 0.5;
  } else {
    return score * 0.6 + mobilityScore * 0.4;
  }
}

function minimax(
  map: ReverseMap,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
  aiColor: ReverseMapState
): number {
  if (depth === 0) {
    return evaluatePosition(map, aiColor);
  }

  const currentColor = map.current_color;
  const moves: { x: number; y: number }[] = [];

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (map.check(i, j, currentColor)) {
        moves.push({ x: i, y: j });
      }
    }
  }

  if (moves.length === 0) {
    const passRequired = map.checkPass(currentColor);
    if (passRequired) {
      const newMap = cloneMap(map);
      newMap.turn();
      return minimax(newMap, depth - 1, alpha, beta, !maximizingPlayer, aiColor);
    }
    return evaluatePosition(map, aiColor);
  }

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newMap = cloneMap(map);
      newMap.put(move.x, move.y, currentColor);
      const evaluation = minimax(newMap, depth - 1, alpha, beta, false, aiColor);
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newMap = cloneMap(map);
      newMap.put(move.x, move.y, currentColor);
      const evaluation = minimax(newMap, depth - 1, alpha, beta, true, aiColor);
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export const smartAICallback: AICallback = (self: ReverseMap) => {
  let bestMove: { x: number; y: number } = { x: 0, y: 0 };
  let bestScore = -Infinity;

  const depth = 4;

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (self.check(i, j, self.current_color)) {
        const newMap = cloneMap(self);
        newMap.put(i, j, self.current_color);

        const score = minimax(newMap, depth - 1, -Infinity, Infinity, false, self.current_color);

        if (score > bestScore) {
          bestScore = score;
          bestMove = { x: i, y: j };
        }
      }
    }
  }

  return bestMove;
};
