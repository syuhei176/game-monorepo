import { Actor, Color, DisplayMode, Engine, Loader } from "excalibur";
import { Cell } from "./cell";
import { Resources } from "./resources";
import { ReverseMap } from "./reverse";
import { basicAICallback } from "./reverse/basic";

class Game extends Engine {
  private reverseMap: ReverseMap

  constructor() {
    super({ width: 400, height: 400, backgroundColor: new Color(10, 120, 26) });
  }

  initialize() {
    this.reverseMap = new ReverseMap((x, y, color) => {
      this.add(new Cell(x, y, color));
    })

    this.reverseMap.setAI(basicAICallback)

    this.input.pointers.primary.on('down', (event) => {
      // console.log(e)
      const x = Math.floor(event.worldPos.x / 50);
      const y = Math.floor(event.worldPos.y / 50);

      const player = this.reverseMap.current_color;

      this.reverseMap.putWithAI(x, y, player)
    })

    this.start()
  }
}

export const game = new Game();
game.initialize();