import { PlayerState } from '../types';

export class Player {
  private state: PlayerState;
  private rect: any;

  constructor(private stage: any, private mainLayer: any) {
    this.state = {
      x: 100,
      y: 332,
      w: 78,
      h: 20,
      offset: 7,
      state: 'stop',
    };

    this.rect = stage.rect(this.state.x, this.state.y, this.state.w, this.state.h);
    this.rect.fill('#ffffff');
    this.rect.stroke('#707070');
    mainLayer.addChild(this.rect);
  }

  update(playerState: 'left' | 'right' | 'stop') {
    this.state.state = playerState;

    if (this.state.state === 'left') {
      this.state.x -= this.state.offset;
      if (this.state.x < 30) {
        this.state.x = 30;
      }
    } else if (this.state.state === 'right') {
      this.state.x += this.state.offset;
      if (this.state.x > 370 - this.state.w) {
        this.state.x = 370 - this.state.w;
      }
    }

    this.rect.setPosition(this.state.x, this.state.y);
  }

  reset() {
    this.state.x = 100;
    this.state.y = 332;
    this.state.state = 'stop';
    this.rect.setPosition(this.state.x, this.state.y);
  }

  getState(): PlayerState {
    return this.state;
  }
}
