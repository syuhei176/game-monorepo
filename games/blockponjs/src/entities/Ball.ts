import { BallState, PlayerState } from '../types';

export class Ball {
  private state: BallState;
  private circle: any;
  private speed: number = 2;

  constructor(private stage: any, private mainLayer: any) {
    this.state = {
      x: 120,
      y: 112,
      r: 5,
      dx: 0.0,
      dy: 0.0,
    };

    this.circle = stage.circle(this.state.x, this.state.y, this.state.r);
    this.circle.fill('#ffffff');
    this.circle.stroke('#707070');
    mainLayer.addChild(this.circle);
  }

  update(
    player: PlayerState,
    checkBoxCollision: () => boolean,
    onPaddleHit: () => void,
    onGameOver: () => void
  ) {
    // Move horizontally first, check collision
    this.state.x += this.state.dx;
    if (checkBoxCollision()) {
      this.state.x -= this.state.dx;
      this.state.dx *= -1;
    }

    // Then move vertically, check collision
    this.state.y += this.state.dy;
    if (checkBoxCollision()) {
      this.state.y -= this.state.dy;
      this.state.dy *= -1;
    }

    // Wall collision
    if (this.state.x < 30) {
      this.state.x = 30;
      this.state.dx = Math.abs(this.state.dx);
    }
    if (this.state.x > 340) {
      this.state.x = 340;
      this.state.dx = -Math.abs(this.state.dx);
    }
    if (this.state.y < 30) {
      this.state.y = 30;
      this.state.dy = Math.abs(this.state.dy);
    }

    // Paddle collision with spin effect
    if (
      this.state.y > player.y - 11 &&
      this.state.x + this.state.r * 2 > player.x &&
      this.state.x < player.x + player.w
    ) {
      this.state.y = player.y - 11;
      this.state.dy = -Math.abs(this.state.dy);

      // Apply spin based on contact position
      const allLength = (player.w + this.state.r) / 2;
      const r = this.state.x + 5 - player.x - allLength;
      this.state.dx += (r / allLength) * 1.2;

      // Normalize to maintain constant speed
      const len = Math.sqrt(this.state.dx * this.state.dx + this.state.dy * this.state.dy);
      this.state.dx = (this.state.dx / len) * this.speed;
      this.state.dy = (this.state.dy / len) * this.speed;

      onPaddleHit();
    }

    // Game over if ball falls below paddle
    if (this.state.y > player.y + 20) {
      onGameOver();
    }

    this.circle.setPosition(this.state.x, this.state.y);
  }

  reset() {
    this.state.x = 200;
    this.state.y = 200;
    this.state.dx = 0;
    this.state.dy = 1;
    this.circle.setPosition(this.state.x, this.state.y);
  }

  getState(): BallState {
    return this.state;
  }
}
