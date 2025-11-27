export enum ReverseMapState {
  BLOCK,
  EMPTY,
  WHITE,
  BLACK
}

export type ChangeColorCallback = (x: number, y: number, color: ReverseMapState) => void


type AICallbackResult = { x: number, y: number }

export type AICallback = (self: ReverseMap) => AICallbackResult


export class ReverseMap {
  data: number[]
  current_color: ReverseMapState
  changeColorCallback: ChangeColorCallback
  aiCallback: AICallback | undefined

  constructor(changeColorCallback: ChangeColorCallback) {
    this.changeColorCallback = changeColorCallback
    this.data = [];
    this.current_color = ReverseMapState.WHITE;

    for (var i = 0; i < 8 * 8; i++) this.data[i] = ReverseMapState.EMPTY;

    this.change_color(3, 3, ReverseMapState.BLACK);
    this.change_color(3, 4, ReverseMapState.WHITE);
    this.change_color(4, 3, ReverseMapState.WHITE);
    this.change_color(4, 4, ReverseMapState.BLACK);

  }

  putWithAI(x: number, y: number, color: ReverseMapState) {
    const isTurnSucceed = this.put(x, y, color)

    if (isTurnSucceed && this.aiCallback) {
      const passRequired = this.checkPass(this.current_color)

      if (passRequired) {
        this.turn();
      } else {
        this.putByAI()
      }
    }
  }

  putByAI() {
    if (this.aiCallback) {
      const result = this.aiCallback(this)

      setTimeout(() => {
        this.put(result.x, result.y, this.current_color)

        const passRequired = this.checkPass(this.current_color)

        if (passRequired) {
          this.turn()
          this.putByAI()
        }
      }, 1000)
    }
  }


  put(x: number, y: number, color: ReverseMapState) {
    if (this._put(x, y, color) > 0) {
      this.change_color(x, y, color);
      this.turn();

      return true
    }

    return false
  }

  checkPass(color: ReverseMapState) {
    let availables = 0
    let empty = 0

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        let col = this.get_color(i, j);
        if (col === ReverseMapState.EMPTY) {
          empty++
        }

        if (this.check(i, j, color)) {
          availables++
        }
      }
    }

    return empty > 0 && availables === 0
  }


  check(x: number, y: number, color: ReverseMapState) {
    return this._check(x, y, color, false)
  }

  _put(x: number, y: number, color: ReverseMapState) {
    return this._check(x, y, color, true)
  }

  _check(x: number, y: number, color: ReverseMapState, isMutable: boolean) {
    var col = this.get_color(x, y);

    if (col !== ReverseMapState.EMPTY) {
      return 0
    }

    return this.checkPart(x - 1, y, color, [-1, 0], isMutable) +
      this.checkPart(x + 1, y, color, [1, 0], isMutable) +
      this.checkPart(x, y + 1, color, [0, 1], isMutable) +
      this.checkPart(x, y - 1, color, [0, -1], isMutable) +
      this.checkPart(x - 1, y - 1, color, [-1, -1], isMutable) +
      this.checkPart(x + 1, y + 1, color, [1, 1], isMutable) +
      this.checkPart(x - 1, y + 1, color, [-1, 1], isMutable) +
      this.checkPart(x + 1, y - 1, color, [1, -1], isMutable);
  }

  checkPart(x: number, y: number, color: ReverseMapState, d: number[], isMutable: boolean) {
    const r = this.checkPart2(x, y, color, d, isMutable)

    if (r < 0) {
      return 0
    }

    return r
  }

  checkPart2(x: number, y: number, color: ReverseMapState, d: number[], isMutable: boolean) {
    var col = this.get_color(x, y);
    if (col == ReverseMapState.BLOCK) {
      return -1;
    } else if (col == ReverseMapState.EMPTY) {
      return -1;
    } else {
      if (col == color) {
        return 0;
      } else {
        var c = this.checkPart2(x + d[0], y + d[1], color, d, isMutable);
        if (c >= 0) {
          if (isMutable) {
            this.change_color(x, y, color);
          }
          return c + 1;
        }
      }
    }

    return -1
  }

  change_color(x: number, y: number, color: ReverseMapState) {
    this.changeColorCallback(x, y, color)
    this.set_color(x, y, color);
  }

  get_color(x: number, y: number) {
    if (x >= 0 && y >= 0 && x < 8 && y < 8)
      return this.data[x + y * 8];
    else
      return ReverseMapState.BLOCK;
  }

  set_color = function (x: number, y: number, color: ReverseMapState) {
    if (x >= 0 && y >= 0 && x < 8 && y < 8) {
      this.data[x + y * 8] = color;
      return color;
    } else {
      return ReverseMapState.BLOCK;
    }
  }


  setAI(aiCallback: AICallback) {
    this.aiCallback = aiCallback
  }

  turn() {
    if (this.current_color == ReverseMapState.WHITE) {
      this.current_color = ReverseMapState.BLACK;
    } else if (this.current_color == ReverseMapState.BLACK) {
      this.current_color = ReverseMapState.WHITE;
    }

  }
}



