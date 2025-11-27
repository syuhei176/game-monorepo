import { PlayerState } from '../types';

export class InputManager {
  private playerState: 'left' | 'right' | 'stop' = 'stop';
  private browserSize = {
    width: window.innerWidth || document.body.clientWidth,
    height: window.innerHeight || document.body.clientHeight,
  };

  constructor(private player: PlayerState) {
    this.setupKeyboardListeners();
  }

  setupTouchListeners(stageRect: any) {
    stageRect.listen(
      'touchstart',
      (event: any) => {
        const left = event.clientX < this.browserSize.width / 2;
        if (left) {
          this.moveLeft();
        } else {
          this.moveRight();
        }
      },
      { passive: false, useCapture: false }
    );

    stageRect.listen(
      'touchend',
      () => {
        this.stop();
      },
      { passive: false, useCapture: false }
    );
  }

  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.keyCode === 37 || e.keyCode === 65) {
        // Left arrow or A
        this.moveLeft();
      } else if (e.keyCode === 39 || e.keyCode === 68) {
        // Right arrow or D
        this.moveRight();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.keyCode === 37 || e.keyCode === 65) {
        this.stop();
      } else if (e.keyCode === 39 || e.keyCode === 68) {
        this.stop();
      }
    });
  }

  private moveLeft() {
    this.playerState = 'left';
  }

  private moveRight() {
    this.playerState = 'right';
  }

  private stop() {
    this.playerState = 'stop';
  }

  getPlayerState(): 'left' | 'right' | 'stop' {
    return this.playerState;
  }
}
