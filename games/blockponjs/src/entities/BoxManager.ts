import { Box, BallState } from '../types';

export class BoxManager {
  private boxes: Box[] = [];

  constructor(private stage: any, private mainLayer: any) {
    this.initializeBoxes();
  }

  private initializeBoxes() {
    // Create 7x8 grid of boxes
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 8; j++) {
        this.boxes.push({
          x: 70 + j * 32,
          y: 62 + i * 20,
          w: 30,
          h: 18,
          elem: null,
          deleted: false,
        });
      }
    }
  }

  render() {
    this.boxes.forEach((box) => {
      if (box.elem) {
        box.elem.remove();
      }
      const newBox = this.stage.rect(box.x, box.y, box.w, box.h);
      newBox.fill('#707070');
      newBox.stroke('#707070');
      this.mainLayer.addChild(newBox);
      box.elem = newBox;
      box.deleted = false;
    });
  }

  checkCollision(ball: BallState, onBoxHit: () => void): boolean {
    const collidedBoxes = this.boxes.filter(
      (box) =>
        !box.deleted &&
        ball.x < box.x + box.w &&
        box.x < ball.x + ball.r * 2 &&
        ball.y < box.y + box.h &&
        box.y < ball.y + ball.r * 2
    );

    if (collidedBoxes.length > 0) {
      collidedBoxes.forEach((box) => {
        if (box.elem) {
          box.elem.fill('#00ff00', 1);
          box.elem.remove();
          box.elem = null;
        }
        box.deleted = true;
        onBoxHit();
      });
      return true;
    }

    return false;
  }

  isAllBoxesDestroyed(): boolean {
    return this.boxes.every((box) => box.deleted);
  }

  reset() {
    this.render();
  }
}
