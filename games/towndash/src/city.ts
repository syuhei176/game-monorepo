import * as THREE from 'three'
import { COLORS, mat, pick } from './materials'
import { makeGroundedBase } from './modelUtils'
import type { LevelData } from './types'
import type { GameAssets } from './assetLoader'

/** Plane on which the gameplay happens (z = 0). Background sits behind it. */
const LANE_Z = 0

/** A small apartment / office building with a grid of windows. */
function createBuilding(seed: number): THREE.Group {
  const g = new THREE.Group()
  const w = 4 + (seed % 3)
  const h = 7 + (seed % 4) * 1.5
  const d = 4

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(pick(COLORS.building, seed)))
  body.position.y = h / 2
  body.castShadow = true
  body.receiveShadow = true
  g.add(body)

  const winMat = mat(COLORS.window, { emissive: COLORS.window, emissiveIntensity: 0.2 })
  const cols = 3
  const rows = Math.max(2, Math.floor(h / 1.6))
  const winGeo = new THREE.BoxGeometry(0.6, 0.7, 0.1)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const win = new THREE.Mesh(winGeo, winMat)
      win.position.set(
        -w / 2 + (w / (cols + 1)) * (c + 1),
        1.2 + r * 1.5,
        d / 2 + 0.01,
      )
      g.add(win)
    }
  }
  return g
}

/** Leafy tree: trunk plus a few clustered icosahedron blobs. */
function createTree(seed: number): THREE.Group {
  const g = new THREE.Group()
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.6, 6), mat(COLORS.trunk))
  trunk.position.y = 0.8
  trunk.castShadow = true
  g.add(trunk)

  const leafMat = mat(pick(COLORS.leaf, seed))
  for (let i = 0; i < 3; i++) {
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 + (i % 2) * 0.3, 0), leafMat)
    blob.position.set((i - 1) * 0.5, 1.9 + (i % 2) * 0.4, (i % 2) * 0.3)
    blob.castShadow = true
    g.add(blob)
  }
  return g
}

/** Puffy cloud made of overlapping spheres. */
function createCloud(seed: number): THREE.Group {
  const g = new THREE.Group()
  const m = mat(COLORS.cloud, { roughness: 1, emissive: COLORS.cloud, emissiveIntensity: 0.3 })
  const n = 3 + (seed % 3)
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(1 + ((seed + i) % 2) * 0.6, 8, 8), m)
    s.position.set((i - n / 2) * 1.3, ((i % 2) - 0.5) * 0.6, 0)
    g.add(s)
  }
  return g
}

/**
 * Builds the static city scenery and the road. Returns the cloud groups so the
 * caller can drift them slowly across the sky.
 */
export function buildCity(
  scene: THREE.Scene,
  level: LevelData,
  assets: GameAssets,
): { clouds: THREE.Group[] } {
  const minX = level.grounds[0].start
  const maxX = level.grounds[level.grounds.length - 1].end
  // Props must only stand on actual road, never bridging a pit (which would look
  // like a crossable bridge even though pits are meant to be jumped).
  const onSolidGround = (x: number): boolean =>
    level.grounds.some((g) => x >= g.start && x <= g.end)

  // --- Road + sidewalks for each ground segment (gaps stay as pits) ---
  for (const seg of level.grounds) {
    const len = seg.end - seg.start
    const cx = (seg.start + seg.end) / 2

    const road = new THREE.Mesh(new THREE.BoxGeometry(len, 1, 6), mat(COLORS.road, { roughness: 1 }))
    road.position.set(cx, level.groundY - 0.5, LANE_Z)
    road.receiveShadow = true
    scene.add(road)

    // dashed centre line
    const dashCount = Math.floor(len / 3)
    const dashMat = mat(COLORS.laneLine, { emissive: COLORS.laneLine, emissiveIntensity: 0.1 })
    for (let i = 0; i < dashCount; i++) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.25), dashMat)
      dash.position.set(seg.start + 1.5 + i * 3, level.groundY + 0.01, LANE_Z)
      scene.add(dash)
    }

    // raised sidewalk behind the lane
    const walk = new THREE.Mesh(
      new THREE.BoxGeometry(len, 1.2, 2.5),
      mat(COLORS.sidewalk, { roughness: 1 }),
    )
    walk.position.set(cx, level.groundY - 0.4, LANE_Z - 4.2)
    walk.receiveShadow = true
    scene.add(walk)
  }

  // --- Distant green ground plane so pits don't show the void ---
  const far = new THREE.Mesh(
    new THREE.BoxGeometry(maxX - minX + 80, 2, 120),
    mat(COLORS.farGround, { roughness: 1 }),
  )
  far.position.set((minX + maxX) / 2, -9, -50)
  scene.add(far)

  // --- Reusable GLB bases. makeGroundedBase wraps each model so its origin is
  // the bottom-centre; cloning + setting the wrapper's position then drops the
  // model neatly onto a surface instead of burying it by half its height. ---
  const denchuBase = makeGroundedBase(assets.denchu.scene, 5)
  const vendingBase = makeGroundedBase(assets.vending.scene, 1.9)
  const heiBase = makeGroundedBase(assets.hei.scene, 1)
  const houseBase = makeGroundedBase(assets.house.scene, 5)
  const gaitouBase = makeGroundedBase(assets.gaitou.scene, 4)

  // Raised sidewalk surface props stand on; the road surface is groundY itself.
  const walkTop = level.groundY + 0.2

  // --- Buildings along the back, alternating houses (GLB) and apartments ---
  let seed = 0
  for (let x = minX; x <= maxX; x += 6) {
    seed++
    const back = seed % 2 === 0 ? houseBase.clone() : createBuilding(seed)
    back.position.set(x, 0, LANE_Z - 9 - (seed % 2) * 2)
    scene.add(back)

    // a second, taller row even further back for depth
    if (seed % 3 === 0) {
      const deep = createBuilding(seed + 7)
      deep.position.set(x + 3, 0, LANE_Z - 16)
      scene.add(deep)
    }
  }

  // --- Street furniture on the sidewalk strip (denchu GLB, gaitou GLB, tree) ---
  seed = 0
  for (let x = minX + 2; x <= maxX; x += 8) {
    seed++
    if (!onSolidGround(x)) continue
    const prop = seed % 3 === 0 ? denchuBase.clone() : seed % 3 === 1 ? gaitouBase.clone() : createTree(seed)
    prop.position.set(x, walkTop, LANE_Z - 3.6)
    scene.add(prop)
  }

  // --- Vending machines dotted along the street ---
  for (let x = minX + 12; x <= maxX; x += 30) {
    if (!onSolidGround(x)) continue
    const v = vendingBase.clone()
    v.position.set(x, walkTop, LANE_Z - 3)
    scene.add(v)
  }

  // --- Low wall (hei) forming the kerb at the front of the raised sidewalk ---
  for (let x = minX; x <= maxX; x += 2.05) {
    if (!onSolidGround(x)) continue
    const w = heiBase.clone()
    w.position.set(x, level.groundY - 0.5, LANE_Z - 2.3)
    scene.add(w)
  }

  // --- Clouds ---
  const clouds: THREE.Group[] = []
  for (let i = 0; i < 10; i++) {
    const cloud = createCloud(i)
    cloud.position.set(minX + i * 22 + (i % 3) * 5, 12 + (i % 3) * 2.5, LANE_Z - 22)
    scene.add(cloud)
    clouds.push(cloud)
  }

  return { clouds }
}
