import * as THREE from 'three'

/** Bright, pop colour palette evoking an ordinary Japanese suburb. */
export const COLORS = {
  sky: 0x87ceeb,
  road: 0x565d66,
  sidewalk: 0xcdc8bb,
  laneLine: 0xf2c94c,
  farGround: 0x9ccc65,
  cloud: 0xffffff,
  wall: [0xfff3e0, 0xe3f2fd, 0xfce4ec, 0xf1f8e9, 0xfff8e1],
  roof: [0xe74c3c, 0x2e86de, 0xe67e22, 0x8e44ad, 0x16a085],
  building: [0xbdc3c7, 0xd7ccc8, 0xcfd8dc, 0xb0bec5],
  window: 0xaed6f1,
  trunk: 0x8d6e63,
  leaf: [0x66bb6a, 0x43a047, 0x7cb342],
  pole: 0x607d8b,
  lamp: 0xfff176,
  skin: 0xffcc80,
  hair: 0x3e2723,
  shirt: 0x1e88e5,
  pants: 0x37474f,
  cat: 0x6d4c41,
  catBelly: 0xefebe9,
  dorayakiSkin: 0xd2a04a,
  dorayakiBean: 0x5d3a1a,
  flagPole: 0xeceff1,
  flagCloth: 0xff5252,
} as const

interface MatOpts {
  flat?: boolean
  emissive?: number
  emissiveIntensity?: number
  roughness?: number
  metalness?: number
}

/** Flat-shaded standard material — gives the geometry a low-poly, toy-like look. */
export function mat(color: number, opts: MatOpts = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    flatShading: opts.flat ?? true,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    roughness: opts.roughness ?? 0.85,
    metalness: opts.metalness ?? 0.0,
  })
}

export function pick<T>(arr: readonly T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length]
}
