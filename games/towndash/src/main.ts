import * as THREE from 'three'
import { InputState } from './input'
import { createLevel } from './level'
import { buildCity } from './city'
import {
  createPlayer,
  createCat,
  createDorayaki,
  createFlag,
  createPlatformMesh,
  type PlayerModel,
} from './characters'
import { loadAssets } from './assetLoader'
import { COLORS } from './materials'
import type { LevelData, Solid, Vec2 } from './types'

// --- Tunable physics constants (world units, seconds) ---
const GRAVITY = 42
const MAX_SPEED = 8.5
const ACCEL = 60
const FRICTION = 55
const JUMP_SPEED = 15.5
const PLAYER_HW = 0.4
const PLAYER_HH = 0.9
const ENEMY_HW = 0.45
const ENEMY_HH = 0.45
const FALL_Y = -8
const INVULN_TIME = 1.2

type Status = 'ready' | 'playing' | 'clear' | 'gameover'

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))

function overlap(px: number, py: number, phw: number, phh: number, s: Solid): boolean {
  return Math.abs(px - s.x) < phw + s.hw && Math.abs(py - s.y) < phh + s.hh
}

class Game {
  private readonly scene = new THREE.Scene()
  private readonly camera: THREE.PerspectiveCamera
  private readonly renderer: THREE.WebGLRenderer
  private readonly clock = new THREE.Clock()
  private readonly input = new InputState()

  private readonly level: LevelData
  private readonly solids: Solid[]
  private readonly sun: THREE.DirectionalLight
  private clouds: THREE.Group[] = []
  private player!: PlayerModel
  private flag!: THREE.Group

  private status: Status = 'ready'
  private pos: Vec2 = { x: 0, y: PLAYER_HH }
  private vel: Vec2 = { x: 0, y: 0 }
  private onGround = false
  private lastSafe: Vec2 = { x: 0, y: PLAYER_HH }
  private dorayaki = 0
  private stomps = 0
  private elapsed = 0
  private life = 3
  private invuln = 0
  private animTime = 0
  private facing = 1

  // HUD elements
  private scoreEl!: HTMLElement
  private timeEl!: HTMLElement
  private lifeEl!: HTMLElement
  private msgEl!: HTMLElement

  constructor() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    document.body.appendChild(this.renderer.domElement)

    // Scene / atmosphere
    this.scene.background = new THREE.Color(COLORS.sky)
    this.scene.fog = new THREE.Fog(COLORS.sky, 38, 100)

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      300,
    )
    this.camera.position.set(0, 7, 17)
    this.camera.lookAt(3, 2.8, 0)

    // Lights
    const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x8d9b6a, 0.95)
    this.scene.add(hemi)

    this.sun = new THREE.DirectionalLight(0xfff4e0, 1.15)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    this.sun.shadow.camera.near = 0.5
    this.sun.shadow.camera.far = 70
    const sc = this.sun.shadow.camera
    sc.left = -18
    sc.right = 18
    sc.top = 18
    sc.bottom = -18
    sc.updateProjectionMatrix()
    this.scene.add(this.sun, this.sun.target)

    // Level data is geometry-independent and ready now; the rest of the world is
    // assembled in init() once the GLB assets finish loading.
    this.level = createLevel()
    this.solids = this.buildSolids()

    // HUD + input
    this.buildHud()
    this.input.attach(document.body)

    window.addEventListener('resize', () => this.onResize())

    this.showMessage(`🥮 タウンダッシュ<br><span class="td-hint">読み込み中…</span>`)
  }

  /** Loads GLB assets, then builds the world and starts the render loop. */
  async init(): Promise<void> {
    const assets = await loadAssets()

    this.clouds = buildCity(this.scene, this.level, assets).clouds
    this.buildPlatformMeshes()
    this.buildCoinMeshes()
    this.buildEnemyMeshes()

    this.flag = createFlag()
    this.flag.position.set(this.level.goalX, this.level.groundY, 0)
    this.scene.add(this.flag)

    this.player = createPlayer(assets.player)
    this.scene.add(this.player.group)

    this.showMessage(this.readyMessage())
    this.renderer.setAnimationLoop(() => this.frame())
  }

  // --- Scene construction helpers ---

  private buildSolids(): Solid[] {
    const solids: Solid[] = []
    for (const seg of this.level.grounds) {
      const len = seg.end - seg.start
      solids.push({ x: (seg.start + seg.end) / 2, y: this.level.groundY - 0.5, hw: len / 2, hh: 0.5 })
    }
    for (const p of this.level.platforms) {
      solids.push({ x: p.x, y: p.y, hw: p.hw, hh: p.hh })
    }
    return solids
  }

  private buildPlatformMeshes(): void {
    for (const p of this.level.platforms) {
      const mesh = createPlatformMesh(p)
      mesh.position.set(p.x, p.y - p.hh, 0)
      this.scene.add(mesh)
    }
  }

  private buildCoinMeshes(): void {
    for (const c of this.level.coins) {
      const mesh = createDorayaki()
      mesh.position.set(c.x, c.y, 0)
      c.mesh = mesh
      this.scene.add(mesh)
    }
  }

  private buildEnemyMeshes(): void {
    for (const e of this.level.enemies) {
      const mesh = createCat()
      mesh.position.set(e.x, e.y, 0)
      e.mesh = mesh
      this.scene.add(mesh)
    }
  }

  private enemyBox(e: { x: number; y: number }): Solid {
    return { x: e.x, y: e.y + ENEMY_HH, hw: ENEMY_HW, hh: ENEMY_HH }
  }

  // --- Game flow ---

  private startGame(): void {
    this.pos = { x: 0, y: PLAYER_HH }
    this.vel = { x: 0, y: 0 }
    this.lastSafe = { x: 0, y: PLAYER_HH }
    this.dorayaki = 0
    this.stomps = 0
    this.elapsed = 0
    this.life = 3
    this.invuln = 0
    this.facing = 1
    this.status = 'playing'

    for (const c of this.level.coins) {
      c.collected = false
      if (c.mesh) c.mesh.visible = true
    }
    for (const e of this.level.enemies) {
      e.alive = true
      e.x = (e.minX + e.maxX) / 2
      e.dir = 1
      if (e.mesh) e.mesh.visible = true
    }
    this.hideMessage()
    this.updateHud()
  }

  private respawn(): void {
    this.pos = { ...this.lastSafe }
    this.vel = { x: 0, y: 0 }
    this.invuln = INVULN_TIME
  }

  private loseLife(): void {
    this.life--
    this.updateHud()
    if (this.life <= 0) {
      this.status = 'gameover'
      // Drop the in-flight movement press so it doesn't instantly restart.
      this.input.clearPressed()
      this.showMessage(
        `💥 ゲームオーバー${this.resultStats(false)}<br><span class="td-hint">タップ / キーで もう一度</span>`,
      )
    } else {
      this.respawn()
    }
  }

  private win(): void {
    this.status = 'clear'
    // The player is usually still holding "right" at the goal; clear that press
    // so the result screen isn't dismissed by it on the very next frame.
    this.input.clearPressed()
    this.showMessage(
      `🎉 ゴール！クリア！${this.resultStats(true)}<br><span class="td-hint">タップ / キーで もう一度</span>`,
    )
  }

  /** Formats elapsed seconds as M:SS.d (one decimal). */
  private static formatTime(s: number): string {
    const m = Math.floor(s / 60)
    const sec = s - m * 60
    return `${m}:${sec.toFixed(1).padStart(4, '0')}`
  }

  /**
   * Final score: dorayaki and stomped cats are worth fixed points, surviving
   * lives give a big bonus, and finishing faster keeps more of a time bonus that
   * bleeds away as the clock runs.
   */
  private finalScore(cleared: boolean): number {
    const timeBonus = cleared ? Math.max(0, 3000 - Math.floor(this.elapsed) * 20) : 0
    return this.dorayaki * 100 + this.stomps * 200 + this.life * 500 + timeBonus
  }

  /** Builds the stats block shown on the clear / game-over screen. */
  private resultStats(cleared: boolean): string {
    const total = this.level.coins.length
    const rows = [
      `<span>⏱ タイム</span><span>${Game.formatTime(this.elapsed)}</span>`,
      `<span>🥮 どら焼き</span><span>${this.dorayaki} / ${total}</span>`,
      `<span>🐱 たおしたネコ</span><span>${this.stomps}</span>`,
      `<span>❤ のこりライフ</span><span>${Math.max(0, this.life)}</span>`,
    ]
    if (cleared && this.dorayaki === total) {
      rows.push(`<span class="td-perfect">✨ パーフェクト!</span><span></span>`)
    }
    return (
      `<div class="td-stats">${rows.map((r) => `<div class="td-stat">${r}</div>`).join('')}</div>` +
      `<div class="td-total">⭐ スコア <b>${this.finalScore(cleared)}</b></div>`
    )
  }

  // --- Main loop ---

  private frame(): void {
    const dt = Math.min(this.clock.getDelta(), 1 / 30)
    this.animTime += dt

    if (this.status === 'playing') {
      this.elapsed += dt
      this.updatePlayerPhysics(dt)
      this.updateEnemies(dt)
      this.updateCoins()
      this.checkBounds()
      this.updateHud()
    } else if (this.input.consumeAnyPressed()) {
      this.startGame()
    }

    this.animatePlayerModel(dt)
    this.updateDecor(dt)
    this.updateCamera(dt)
    this.renderer.render(this.scene, this.camera)
  }

  private updatePlayerPhysics(dt: number): void {
    const dir = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0)
    if (dir !== 0) {
      this.vel.x = clamp(this.vel.x + dir * ACCEL * dt, -MAX_SPEED, MAX_SPEED)
      this.facing = dir
    } else {
      const f = FRICTION * dt
      this.vel.x = this.vel.x > f ? this.vel.x - f : this.vel.x < -f ? this.vel.x + f : 0
    }

    if (this.input.consumeJump() && this.onGround) {
      this.vel.y = JUMP_SPEED
      this.onGround = false
    }
    // variable jump height: releasing the button cuts the ascent
    if (!this.input.jumpHeld && this.vel.y > 4) this.vel.y = 4

    this.vel.y = Math.max(this.vel.y - GRAVITY * dt, -32)

    // Horizontal move + resolve. The EDGE margin on the *vertical* axis means a
    // player resting on a platform (whose top just touches their feet) is not
    // counted as overlapping it sideways — without it, float rounding made the
    // solver occasionally fling the player off the side of the platform.
    const EDGE = 0.02
    this.pos.x += this.vel.x * dt
    for (const s of this.solids) {
      const hit =
        Math.abs(this.pos.x - s.x) < PLAYER_HW + s.hw &&
        Math.abs(this.pos.y - s.y) < PLAYER_HH + s.hh - EDGE
      if (hit) {
        this.pos.x = this.vel.x > 0 ? s.x - s.hw - PLAYER_HW : s.x + s.hw + PLAYER_HW
        this.vel.x = 0
      }
    }
    const leftLimit = this.level.grounds[0].start + 0.5
    if (this.pos.x < leftLimit) {
      this.pos.x = leftLimit
      if (this.vel.x < 0) this.vel.x = 0
    }

    // Vertical move + resolve. EDGE margin on the *horizontal* axis so merely
    // brushing a platform's side doesn't snap the player onto its top.
    this.onGround = false
    this.pos.y += this.vel.y * dt
    for (const s of this.solids) {
      const hit =
        Math.abs(this.pos.x - s.x) < PLAYER_HW + s.hw - EDGE &&
        Math.abs(this.pos.y - s.y) < PLAYER_HH + s.hh
      if (hit) {
        if (this.vel.y <= 0) {
          this.pos.y = s.y + s.hh + PLAYER_HH
          this.onGround = true
        } else {
          this.pos.y = s.y - s.hh - PLAYER_HH
        }
        this.vel.y = 0
      }
    }

    if (this.invuln > 0) this.invuln -= dt

    // checkpoint: remember the latest forward foothold to respawn at on a miss.
    // Invulnerability after respawn covers landing near a patrolling cat.
    if (this.onGround && this.pos.x > this.lastSafe.x) {
      this.lastSafe = { x: this.pos.x, y: this.pos.y }
    }
  }

  private updateEnemies(dt: number): void {
    for (const e of this.level.enemies) {
      if (!e.alive || !e.mesh) continue
      e.x += e.dir * e.speed * dt
      if (e.x > e.maxX) {
        e.x = e.maxX
        e.dir = -1
      } else if (e.x < e.minX) {
        e.x = e.minX
        e.dir = 1
      }
      e.mesh.position.x = e.x
      e.mesh.position.y = e.y + Math.abs(Math.sin(this.animTime * 8)) * 0.06
      e.mesh.rotation.y = e.dir > 0 ? 0 : Math.PI

      if (this.invuln <= 0 && overlap(this.pos.x, this.pos.y, PLAYER_HW, PLAYER_HH, this.enemyBox(e))) {
        const feet = this.pos.y - PLAYER_HH
        if (this.vel.y < 0 && feet > e.y + ENEMY_HH * 0.5) {
          e.alive = false
          e.mesh.visible = false
          this.vel.y = 9
          this.stomps++
          this.updateHud()
        } else {
          this.loseLife()
        }
      }
    }
  }

  private updateCoins(): void {
    for (const c of this.level.coins) {
      if (c.collected || !c.mesh) continue
      c.mesh.rotation.z += 0.05
      c.mesh.position.y = c.y + Math.sin(this.animTime * 3 + c.x) * 0.12
      const dx = this.pos.x - c.x
      const dy = this.pos.y - c.y
      if (dx * dx + dy * dy < 0.95 * 0.95) {
        c.collected = true
        c.mesh.visible = false
        this.dorayaki++
        this.updateHud()
      }
    }
  }

  private checkBounds(): void {
    if (this.pos.y < FALL_Y) {
      this.loseLife()
    } else if (this.pos.x > this.level.goalX) {
      this.win()
    }
  }

  private animatePlayerModel(dt: number): void {
    const g = this.player.group
    // the wrapper's origin is at the player's feet
    g.position.set(this.pos.x, this.pos.y - PLAYER_HH, 0)

    // turn the model to face travel direction (its front is +Z → ±90° gives ±X)
    const targetRotY = this.facing > 0 ? Math.PI / 2 : -Math.PI / 2
    const delta = Math.atan2(
      Math.sin(targetRotY - g.rotation.y),
      Math.cos(targetRotY - g.rotation.y),
    )
    g.rotation.y += delta * Math.min(1, dt * 12)

    // blink during invulnerability
    g.visible = this.invuln > 0 ? Math.floor(this.animTime * 12) % 2 === 0 : true

    // run while moving or airborne; otherwise an idle walk-in-place
    const moving = this.status === 'playing' && Math.abs(this.vel.x) > 0.4
    this.player.setState(!this.onGround || moving ? 'Running' : 'Walking')
    this.player.mixer.update(dt)
  }

  private updateDecor(dt: number): void {
    for (const cloud of this.clouds) {
      cloud.position.x += dt * 0.6
      if (cloud.position.x > this.level.goalX + 30) {
        cloud.position.x = this.level.grounds[0].start - 20
      }
    }
    this.flag.children[1].rotation.y = Math.sin(this.animTime * 3) * 0.25
  }

  private updateCamera(dt: number): void {
    const k = 1 - Math.exp(-dt * 6)
    const targetX = this.pos.x + 3
    const targetY = Math.max(this.pos.y + 3.5, 6)
    this.camera.position.x += (targetX - this.camera.position.x) * k
    this.camera.position.y += (targetY - this.camera.position.y) * k
    this.camera.position.z += (17 - this.camera.position.z) * k
    this.camera.lookAt(this.camera.position.x, Math.max(this.pos.y, 2), 0)

    // keep the sun's shadow frustum around the player
    this.sun.position.set(this.pos.x - 6, 20, 12)
    this.sun.target.position.set(this.pos.x, 0, 0)
    this.sun.target.updateMatrixWorld()
  }

  // --- HUD ---

  private buildHud(): void {
    const style = document.createElement('style')
    style.textContent = `
      .td-hud { position: fixed; inset: 0; pointer-events: none; z-index: 10;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .td-top { position: absolute; top: 14px; left: 16px; right: 16px;
        display: flex; justify-content: space-between; align-items: center; }
      .td-pill { background: rgba(255,255,255,0.82); border-radius: 999px;
        padding: 6px 16px; font-size: 20px; font-weight: 700; color: #37474f;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
      .td-msg { position: absolute; inset: 0; display: flex; flex-direction: column;
        align-items: center; justify-content: center; text-align: center;
        color: #fff; text-shadow: 0 3px 8px rgba(0,0,0,0.4); }
      .td-msg-box { background: rgba(38,50,56,0.55); border-radius: 20px;
        padding: 28px 40px; font-size: 30px; font-weight: 800; line-height: 1.5; }
      .td-sub { font-size: 22px; font-weight: 700; }
      .td-hint { font-size: 16px; font-weight: 600; opacity: 0.9; }
      .td-stats { display: flex; flex-direction: column; gap: 6px;
        margin: 18px auto; padding: 16px 22px; width: fit-content; min-width: 260px;
        background: rgba(255,255,255,0.14); border-radius: 14px; }
      .td-stat { display: flex; justify-content: space-between; gap: 28px;
        font-size: 20px; font-weight: 700; }
      .td-stat span:last-child { font-variant-numeric: tabular-nums; }
      .td-perfect { color: #ffe082; }
      .td-total { font-size: 24px; font-weight: 800; margin-bottom: 6px; }
      .td-total b { font-variant-numeric: tabular-nums; }
      .td-hidden { display: none; }
      .td-btn { position: absolute; bottom: 22px; width: 78px; height: 78px;
        border-radius: 50%; background: rgba(255,255,255,0.32);
        border: 2px solid rgba(255,255,255,0.7); color: #fff; font-size: 34px;
        display: flex; align-items: center; justify-content: center;
        pointer-events: auto; touch-action: none; user-select: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
      .td-btn--active { background: rgba(255,255,255,0.6); transform: scale(0.94); }
    `
    document.head.appendChild(style)

    const hud = document.createElement('div')
    hud.className = 'td-hud'
    hud.innerHTML = `
      <div class="td-top">
        <div class="td-pill" id="td-score">🥮 × 0</div>
        <div class="td-pill" id="td-time">⏱ 0:00.0</div>
        <div class="td-pill" id="td-life">❤❤❤</div>
      </div>
      <div class="td-msg td-hidden" id="td-msg"><div class="td-msg-box"></div></div>
    `
    document.body.appendChild(hud)

    this.scoreEl = hud.querySelector('#td-score') as HTMLElement
    this.timeEl = hud.querySelector('#td-time') as HTMLElement
    this.lifeEl = hud.querySelector('#td-life') as HTMLElement
    this.msgEl = hud.querySelector('#td-msg') as HTMLElement
  }

  private updateHud(): void {
    this.scoreEl.textContent = `🥮 × ${this.dorayaki}`
    this.timeEl.textContent = `⏱ ${Game.formatTime(this.elapsed)}`
    this.lifeEl.textContent = this.life > 0 ? '❤'.repeat(this.life) : '🖤'
  }

  private readyMessage(): string {
    return `🥮 タウンダッシュ<br><span class="td-hint">← → で移動 ／ Space・⤒ でジャンプ</span><br><span class="td-hint">どら焼きを集めてゴールの旗へ！</span><br><span class="td-sub">タップ / キーでスタート</span>`
  }

  private showMessage(html: string): void {
    const box = this.msgEl.querySelector('.td-msg-box') as HTMLElement
    box.innerHTML = html
    this.msgEl.classList.remove('td-hidden')
  }

  private hideMessage(): void {
    this.msgEl.classList.add('td-hidden')
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
}

const game = new Game()
void game.init()
