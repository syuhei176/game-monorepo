import * as THREE from 'three'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { prepModel, enableShadows } from './modelUtils'
import { COLORS, mat } from './materials'
import type { PlatformData } from './types'

export type PlayerAnim = 'Walking' | 'Running'

/** GLB-backed player: a wrapper group plus an animation mixer and a state switch. */
export interface PlayerModel {
  group: THREE.Group
  mixer: THREE.AnimationMixer
  setState(name: PlayerAnim): void
}

/** Player capsule height in world units (matches 2 * PLAYER_HH in main.ts). */
const PLAYER_HEIGHT = 1.8

/** Builds the player from the rigged player GLB, wiring up its walk/run clips. */
export function createPlayer(gltf: GLTF): PlayerModel {
  const model = gltf.scene
  prepModel(model, PLAYER_HEIGHT)
  enableShadows(model)

  const group = new THREE.Group()
  group.add(model)

  const mixer = new THREE.AnimationMixer(model)
  const actions = new Map<string, THREE.AnimationAction>()
  for (const clip of gltf.animations) actions.set(clip.name, mixer.clipAction(clip))

  let current = ''
  const setState = (name: PlayerAnim): void => {
    if (name === current) return
    const next = actions.get(name)
    if (!next) return
    next.reset().fadeIn(0.2).play()
    actions.get(current)?.fadeOut(0.2)
    current = name
  }
  setState('Walking')

  return { group, mixer, setState }
}

/** A stray cat that patrols left/right. */
export function createCat(): THREE.Group {
  const g = new THREE.Group()

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.5), mat(COLORS.cat))
  body.position.y = 0.45
  body.castShadow = true
  g.add(body)

  const belly = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.52), mat(COLORS.catBelly))
  belly.position.set(0.1, 0.32, 0)
  g.add(belly)

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 0.45), mat(COLORS.cat))
  head.position.set(0.5, 0.62, 0)
  head.castShadow = true
  g.add(head)

  // ears
  const earGeo = new THREE.ConeGeometry(0.13, 0.22, 4)
  for (const dx of [-0.13, 0.13]) {
    const ear = new THREE.Mesh(earGeo, mat(COLORS.cat))
    ear.position.set(0.5 + dx, 0.88, 0)
    ear.rotation.y = Math.PI / 4
    g.add(ear)
  }

  // tail
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 5), mat(COLORS.cat))
  tail.position.set(-0.5, 0.6, 0)
  tail.rotation.z = Math.PI / 3
  g.add(tail)

  // legs
  const legGeo = new THREE.BoxGeometry(0.14, 0.3, 0.14)
  for (const dx of [-0.3, 0.3]) {
    for (const dz of [-0.15, 0.15]) {
      const leg = new THREE.Mesh(legGeo, mat(COLORS.cat))
      leg.position.set(dx, 0.15, dz)
      g.add(leg)
    }
  }

  return g
}

/** A dorayaki (red-bean pancake) collectible — the local treasure. */
export function createDorayaki(): THREE.Group {
  const g = new THREE.Group()
  const skinMat = mat(COLORS.dorayakiSkin, { roughness: 0.6 })
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.16, 16), skinMat)
  top.position.y = 0.12
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.4, 0.16, 16), skinMat)
  bottom.position.y = -0.12
  const bean = new THREE.Mesh(
    new THREE.CylinderGeometry(0.43, 0.43, 0.1, 16),
    mat(COLORS.dorayakiBean, { roughness: 0.5 }),
  )
  g.add(top, bottom, bean)
  g.rotation.x = Math.PI / 2 // face the camera like a coin
  return g
}

/** Goal flag at the end of the stage. */
export function createFlag(): THREE.Group {
  const g = new THREE.Group()
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5, 8), mat(COLORS.flagPole))
  pole.position.y = 2.5
  pole.castShadow = true
  g.add(pole)

  const cloth = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.06), mat(COLORS.flagCloth))
  cloth.position.set(0.78, 4.2, 0)
  g.add(cloth)

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 8, 8),
    mat(0xffd54f, { emissive: 0xffd54f, emissiveIntensity: 0.5 }),
  )
  ball.position.y = 5.05
  g.add(ball)
  return g
}

/** Visual mesh for a street prop the player can stand on (matches its hitbox). */
export function createPlatformMesh(p: PlatformData): THREE.Group {
  const g = new THREE.Group()
  if (p.kind === 'truck') {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 2.4), mat(0x4fc3f7))
    cab.position.set(p.hw - 0.7, 0.55, 0)
    cab.castShadow = true
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(p.hw * 2 - 1.2, p.hh * 2, 2.6), mat(0xfafafa))
    cargo.position.set(-0.6, p.hh, 0)
    cargo.castShadow = true
    g.add(cab, cargo)
    // wheels
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12)
    for (const wx of [-p.hw + 0.7, p.hw - 0.9]) {
      const wheel = new THREE.Mesh(wheelGeo, mat(0x212121))
      wheel.rotation.x = Math.PI / 2
      wheel.position.set(wx, -p.hh + 0.4, 1.1)
      g.add(wheel)
    }
  } else if (p.kind === 'sign') {
    const board = new THREE.Mesh(new THREE.BoxGeometry(p.hw * 2, p.hh * 2, 0.2), mat(0x42a5f5))
    board.position.y = p.hh
    board.castShadow = true
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, p.y * 2, 6), mat(0x9e9e9e))
    post.position.y = -p.y + p.hh
    g.add(board, post)
  } else {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(p.hw * 2, p.hh * 2, Math.min(p.hh * 2, 1.4)),
      mat(0xc69c6d),
    )
    box.position.y = p.hh
    box.castShadow = true
    box.receiveShadow = true
    // plank lines
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(p.hw * 2 + 0.02, 0.06, Math.min(p.hh * 2, 1.4) + 0.02),
      mat(0x8d6e3b),
    )
    edge.position.y = p.hh
    g.add(box, edge)
  }
  return g
}
