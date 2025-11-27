import { AICallback, ReverseMap } from ".";

export const basicAICallback: AICallback = (self: ReverseMap) => {
  let bestMove: { x: number, y: number } = { x: 0, y: 0 }
  let bestScore = -1

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      let score = self.check(i, j, self.current_color)

      if (score > 0) {
        if (i == 0 && j == 0 || i == 0 && j == 7 || i == 7 && j == 0 || i == 7 && j == 7) {
          return {
            x: i,
            y: j
          }
        }

        if (i == 1 && j == 1 || i == 1 && j == 6 || i == 6 && j == 1 || i == 6 && j == 6 ||
          i == 1 && j == 0 || i == 1 && j == 7 || i == 6 && j == 0 || i == 6 && j == 7 ||
          i == 0 && j == 1 || i == 0 && j == 6 || i == 7 && j == 1 || i == 7 && j == 6) {
          score = 0
        }

        if (bestScore < score) {
          bestScore = score
          bestMove = {
            x: i,
            y: j
          }
        }
      }
    }
  }

  return bestMove
}