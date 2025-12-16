import { Box, BallState } from "../types";

const STAGE_COLORS = {
  1: "#707070",
  2: "#5a705a",
  3: "#705a5a",
};

export class BoxManager {
  private boxes: Box[] = [];
  private stageLayouts: any[][][] = [
    // Stage 1
    [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ],
    // Stage 2
    [
      [2, 1, 1, 1, 1, 1, 1, 2],
      [1, 2, 1, 1, 1, 1, 2, 1],
      [1, 1, 2, 1, 1, 2, 1, 1],
      [1, 1, 1, 2, 2, 1, 1, 1],
    ],
    // Stage 3
    [
      [3, 2, 1, 1, 1, 1, 2, 3],
      [2, 3, 2, 1, 1, 2, 3, 2],
      [1, 2, 3, 2, 2, 3, 2, 1],
    ],
  ];

  constructor(
    private stage: any,
    private mainLayer: any,
  ) {}

  private initializeBoxes(stageNum: number = 1) {
    this.boxes = [];
    const layout =
      this.stageLayouts[stageNum - 1] ||
      this.stageLayouts[this.stageLayouts.length - 1];

    for (let i = 0; i < layout.length; i++) {
      for (let j = 0; j < layout[i].length; j++) {
        const hp = layout[i][j];
        if (hp > 0) {
          this.boxes.push({
            x: 70 + j * 32,
            y: 82 + i * 20,
            w: 30,
            h: 18,
            hp: hp,
            elem: null,
            deleted: false,
          });
        }
      }
    }
  }

  private render() {
    this.boxes.forEach((box) => {
      if (box.elem) {
        box.elem.remove();
      }
      const newBox = this.stage.rect(box.x, box.y, box.w, box.h);
      this.setBoxColor(newBox, box.hp);
      newBox.stroke("#707070");
      this.mainLayer.addChild(newBox);
      box.elem = newBox;
      box.deleted = false;
    });
  }

  private setBoxColor(boxElement: any, hp: number) {
    const color = STAGE_COLORS[hp] || STAGE_COLORS[1];
    boxElement.fill(color);
  }

  checkCollision(ball: BallState, onBoxHit: () => void): boolean {
    const ballAABB = {
      x: ball.x - ball.r,
      y: ball.y - ball.r,
      w: ball.r * 2,
      h: ball.r * 2,
    };

    const collidedBoxes = this.boxes.filter(
      (box) =>
        !box.deleted &&
        ballAABB.x < box.x + box.w &&
        ballAABB.x + ballAABB.w > box.x &&
        ballAABB.y < box.y + box.h &&
        ballAABB.y + ballAABB.h > box.y,
    );

    if (collidedBoxes.length > 0) {
      collidedBoxes.forEach((box) => {
        box.hp--;
        onBoxHit();

        if (box.hp <= 0) {
          if (box.elem) {
            box.elem.remove();
            box.elem = null;
          }
          box.deleted = true;
        } else {
          this.setBoxColor(box.elem, box.hp);
        }
      });
      return true;
    }

    return false;
  }

  isAllBoxesDestroyed(): boolean {
    return this.boxes.every((box) => box.deleted);
  }

  reset(stage: number) {
    this.initializeBoxes(stage);
    this.render();
  }
}
