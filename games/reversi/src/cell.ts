import {
  Actor,
  Circle,
  Color,
  Matrix,
  Rectangle,
  Vector,
  vec,
  Canvas,
  ExcaliburGraphicsContext,
} from "excalibur";
import { Resources } from "./resources";
import { ReverseMapState } from "./reverse";

export class Cell extends Actor {
  private pieceColor: number;

  constructor(x: number, y: number, player: number) {
    super({
      pos: new Vector(x * 50 + 25, y * 50 + 25),
      width: 40,
      height: 40,
    });
    this.pieceColor = player;
  }

  onInitialize() {
    const canvas = document.createElement("canvas");
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext("2d")!;

    const centerX = 20;
    const centerY = 20;
    const radius = 18;

    if (this.pieceColor === ReverseMapState.BLACK) {
      const gradient = ctx.createRadialGradient(
        centerX - 6,
        centerY - 6,
        2,
        centerX,
        centerY,
        radius,
      );
      gradient.addColorStop(0, "#4a4a4a");
      gradient.addColorStop(0.3, "#2a2a2a");
      gradient.addColorStop(1, "#000000");

      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = "transparent";
      const highlight = ctx.createRadialGradient(
        centerX - 6,
        centerY - 6,
        0,
        centerX - 6,
        centerY - 6,
        8,
      );
      highlight.addColorStop(0, "rgba(255, 255, 255, 0.3)");
      highlight.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = highlight;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const gradient = ctx.createRadialGradient(
        centerX - 6,
        centerY - 6,
        2,
        centerX,
        centerY,
        radius,
      );
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.7, "#f0f0f0");
      gradient.addColorStop(1, "#d0d0d0");

      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = "transparent";
      const highlight = ctx.createRadialGradient(
        centerX - 6,
        centerY - 6,
        0,
        centerX - 6,
        centerY - 6,
        10,
      );
      highlight.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      highlight.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = highlight;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const imageSource = new Canvas({
      width: 40,
      height: 40,
      draw: (ctx: ExcaliburGraphicsContext) => {
        ctx.drawImage(canvas, 0, 0);
      },
    });

    this.graphics.use(imageSource);

    this.on("pointerdown", (e) => {
      console.log(e);
    });
  }
}
