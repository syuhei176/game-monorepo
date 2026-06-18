import type { LevelData, PlatformData, CoinData, EnemyData, GroundSeg } from './types'

/**
 * Hand-authored stage laid out along +x. Road segments leave pits between them,
 * platforms sit on top of street props, dorayaki line jump arcs, cats patrol.
 */
export function createLevel(): LevelData {
  const groundY = 0

  const grounds: GroundSeg[] = [
    { start: -6, end: 58 },
    { start: 62.5, end: 108 },
    { start: 112.5, end: 165 },
    { start: 169.5, end: 226 },
  ]

  const platforms: PlatformData[] = [
    // delivery truck you can hop onto
    { kind: 'truck', x: 30, y: 0.8, hw: 2.4, hh: 0.8 },
    // crate staircase
    { kind: 'crate', x: 44, y: 0.6, hw: 0.7, hh: 0.6 },
    { kind: 'crate', x: 46, y: 1.2, hw: 0.7, hh: 1.2 },
    { kind: 'crate', x: 48, y: 1.8, hw: 0.7, hh: 1.8 },
    // road sign to stand on
    { kind: 'sign', x: 90, y: 1.6, hw: 1.3, hh: 0.35 },
    // crates near the second half
    { kind: 'crate', x: 138, y: 0.7, hw: 0.7, hh: 0.7 },
    { kind: 'crate', x: 140.4, y: 1.3, hw: 0.7, hh: 1.3 },
    { kind: 'truck', x: 190, y: 0.8, hw: 2.4, hh: 0.8 },
  ]

  const coinAt = (x: number, y: number): CoinData => ({ x, y, collected: false })

  const coins: CoinData[] = [
    coinAt(12, 1.4),
    coinAt(16, 1.4),
    coinAt(20, 1.4),
    // arc over the truck
    coinAt(28, 2.6),
    coinAt(30, 3.0),
    coinAt(32, 2.6),
    // up the crate stairs
    coinAt(46, 3.0),
    coinAt(48, 3.6),
    // over the first pit
    coinAt(60, 2.2),
    coinAt(61, 2.2),
    coinAt(62, 2.2),
    // on the sign
    coinAt(90, 2.6),
    coinAt(96, 1.4),
    coinAt(100, 1.4),
    // over the second pit
    coinAt(110, 2.2),
    coinAt(111, 2.2),
    coinAt(112, 2.2),
    coinAt(140.4, 2.6),
    coinAt(150, 1.4),
    coinAt(156, 1.4),
    // over the third pit
    coinAt(167, 2.2),
    coinAt(168, 2.2),
    coinAt(169, 2.2),
    // arc over the second truck
    coinAt(188, 2.6),
    coinAt(190, 3.0),
    coinAt(192, 2.6),
    coinAt(206, 1.4),
    coinAt(210, 1.4),
  ]

  const enemyAt = (min: number, max: number, speed = 2.2): EnemyData => ({
    x: (min + max) / 2,
    y: groundY,
    dir: 1,
    minX: min,
    maxX: max,
    speed,
    alive: true,
  })

  const enemies: EnemyData[] = [
    enemyAt(36, 54),
    enemyAt(80, 104),
    enemyAt(120, 150),
    enemyAt(196, 222),
  ]

  return {
    groundY,
    grounds,
    platforms,
    coins,
    enemies,
    goalX: 222,
  }
}
