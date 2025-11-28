import {
  Actor,
  Color,
  DisplayMode,
  Engine,
  Loader,
  Canvas,
  ExcaliburGraphicsContext,
  Vector,
  Label,
  Font,
  FontUnit,
} from "excalibur";
import { Cell } from "./cell";
import { Resources } from "./resources";
import { ReverseMap, ReverseMapState } from "./reverse";
import { basicAICallback } from "./reverse/basic";

class Game extends Engine {
  private reverseMap: ReverseMap;
  private playerColorLabel: Label;
  private currentTurnLabel: Label;

  constructor() {
    super({ width: 400, height: 480, backgroundColor: new Color(10, 120, 26) });
  }

  initialize() {
    this.addGridLines();
    this.addUILabels();

    this.reverseMap = new ReverseMap((x, y, color) => {
      this.add(new Cell(x, y, color));
      if (this.reverseMap) {
        this.updateTurnLabel();
      }
    });

    this.reverseMap.setAI(basicAICallback);
    this.updateTurnLabel();

    this.input.pointers.primary.on("down", (event) => {
      // console.log(e)
      const x = Math.floor(event.worldPos.x / 50);
      const y = Math.floor(event.worldPos.y / 50);

      const player = this.reverseMap.current_color;

      this.reverseMap.putWithAI(x, y, player);
    });

    this.start();
  }

  private addUILabels() {
    this.playerColorLabel = new Label({
      text: "あなた: 白",
      pos: new Vector(200, 420),
      font: new Font({
        family: "sans-serif",
        size: 20,
        unit: FontUnit.Px,
        color: Color.White,
      }),
    });
    this.add(this.playerColorLabel);

    this.currentTurnLabel = new Label({
      text: "現在のターン: 白",
      pos: new Vector(200, 450),
      font: new Font({
        family: "sans-serif",
        size: 20,
        unit: FontUnit.Px,
        color: Color.White,
      }),
    });
    this.add(this.currentTurnLabel);
  }

  private updateTurnLabel() {
    const currentColor =
      this.reverseMap.current_color === ReverseMapState.WHITE ? "白" : "黒";
    this.currentTurnLabel.text = `現在のターン: ${currentColor}`;
  }

  private addGridLines() {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d")!;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 50, 0);
      ctx.lineTo(i * 50, 400);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * 50);
      ctx.lineTo(400, i * 50);
      ctx.stroke();
    }

    const gridGraphic = new Canvas({
      width: 400,
      height: 400,
      draw: (ctx: ExcaliburGraphicsContext) => {
        ctx.drawImage(canvas, 0, 0);
      },
    });

    const gridActor = new Actor({
      x: 200,
      y: 200,
      z: -1,
    });

    gridActor.graphics.anchor = new Vector(0.5, 0.5);
    gridActor.graphics.use(gridGraphic);
    this.add(gridActor);
  }
}

export const game = new Game();
game.initialize();
