/**
 * Unified keyboard + touch input. `jumpQueued` is an edge flag consumed once per
 * jump; `left`/`right`/`jumpHeld` are continuous states.
 */
export class InputState {
  left = false
  right = false
  jumpHeld = false
  private jumpQueued = false
  /** Set on any fresh press — used to start / restart the game. */
  anyPressed = false

  attach(canvasParent: HTMLElement): void {
    window.addEventListener('keydown', (e) => this.onKey(e, true))
    window.addEventListener('keyup', (e) => this.onKey(e, false))

    this.buildTouchControls(canvasParent)
  }

  private onKey(e: KeyboardEvent, down: boolean): void {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.left = down
        e.preventDefault()
        break
      case 'ArrowRight':
      case 'KeyD':
        this.right = down
        e.preventDefault()
        break
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        this.setJump(down)
        e.preventDefault()
        break
      default:
        return
    }
    // Only a *fresh* press counts as "any pressed": holding a key fires repeated
    // keydown events (e.repeat), which would otherwise keep the flag set and make
    // the clear/game-over screen restart the instant it appears.
    if (down && !e.repeat) this.anyPressed = true
  }

  private setJump(down: boolean): void {
    if (down && !this.jumpHeld) this.jumpQueued = true
    this.jumpHeld = down
  }

  /** Returns true once per jump press, then clears the edge flag. */
  consumeJump(): boolean {
    if (this.jumpQueued) {
      this.jumpQueued = false
      return true
    }
    return false
  }

  consumeAnyPressed(): boolean {
    if (this.anyPressed) {
      this.anyPressed = false
      return true
    }
    return false
  }

  /** Drops any pending fresh-press so it can't trigger an immediate restart. */
  clearPressed(): void {
    this.anyPressed = false
  }

  private buildTouchControls(parent: HTMLElement): void {
    const makeBtn = (label: string, side: 'left' | 'right', offset: number): HTMLDivElement => {
      const b = document.createElement('div')
      b.className = 'td-btn'
      b.textContent = label
      b.style[side] = `${offset}px`
      parent.appendChild(b)
      return b
    }

    const leftBtn = makeBtn('◀', 'left', 16)
    const rightBtn = makeBtn('▶', 'left', 104)
    const jumpBtn = makeBtn('⤒', 'right', 16)

    const bind = (el: HTMLElement, onDown: () => void, onUp: () => void): void => {
      const start = (e: Event) => {
        e.preventDefault()
        el.classList.add('td-btn--active')
        this.anyPressed = true
        onDown()
      }
      const end = (e: Event) => {
        e.preventDefault()
        el.classList.remove('td-btn--active')
        onUp()
      }
      el.addEventListener('pointerdown', start)
      el.addEventListener('pointerup', end)
      el.addEventListener('pointerleave', end)
      el.addEventListener('pointercancel', end)
    }

    bind(
      leftBtn,
      () => (this.left = true),
      () => (this.left = false),
    )
    bind(
      rightBtn,
      () => (this.right = true),
      () => (this.right = false),
    )
    bind(
      jumpBtn,
      () => this.setJump(true),
      () => this.setJump(false),
    )
  }
}
