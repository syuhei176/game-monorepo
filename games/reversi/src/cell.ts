import { Actor, Circle, Color, Matrix, Rectangle, Vector, vec } from "excalibur";
import { Resources } from "./resources";
import { ReverseMapState } from "./reverse";

export class Cell extends Actor {
  constructor(x: number, y: number, player: number) {
    super({
      pos: new Vector(x * 50 + 25, y * 50 + 25),
      width: 40,
      height: 40,
      color: player === ReverseMapState.BLACK ? Color.Black : Color.White
    });
  }

  onInitialize() {
    this.on('pointerdown', (e) => {
      console.log(e)
    })
  }
}
