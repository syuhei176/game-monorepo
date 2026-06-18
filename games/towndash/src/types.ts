import type { Object3D } from 'three'

/** 2D vector used for gameplay positions/velocities (x: horizontal, y: vertical). */
export interface Vec2 {
  x: number
  y: number
}

/** Axis-aligned solid box the player can stand on / collide with (center + half size). */
export interface Solid {
  x: number
  y: number
  hw: number
  hh: number
}

/** A continuous stretch of road. Gaps between segments are pits to jump over. */
export interface GroundSeg {
  start: number
  end: number
}

export type PlatformKind = 'crate' | 'truck' | 'sign'

export interface PlatformData extends Solid {
  kind: PlatformKind
}

export interface CoinData {
  x: number
  y: number
  collected: boolean
  mesh?: Object3D
}

export interface EnemyData {
  x: number
  y: number
  dir: number
  minX: number
  maxX: number
  speed: number
  alive: boolean
  mesh?: Object3D
}

export interface LevelData {
  /** Ground top surface height (world y). */
  groundY: number
  grounds: GroundSeg[]
  platforms: PlatformData[]
  coins: CoinData[]
  enemies: EnemyData[]
  goalX: number
}
