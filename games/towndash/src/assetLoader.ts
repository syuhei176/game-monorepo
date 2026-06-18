import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import playerUrl from '../assets/player2.glb?url'
import denchuUrl from '../assets/denchu.glb?url'
import heiUrl from '../assets/hei.glb?url'
import vendingUrl from '../assets/vending-machine.glb?url'
import houseUrl from '../assets/house.glb?url'
import gaitouUrl from '../assets/gaitou.glb?url'

export interface GameAssets {
  player: GLTF
  denchu: GLTF
  hei: GLTF
  vending: GLTF
  house: GLTF
  gaitou: GLTF
}

/** Loads all GLB models up front so the game can start with everything ready. */
export async function loadAssets(): Promise<GameAssets> {
  const loader = new GLTFLoader()
  const [player, denchu, hei, vending, house, gaitou] = await Promise.all([
    loader.loadAsync(playerUrl),
    loader.loadAsync(denchuUrl),
    loader.loadAsync(heiUrl),
    loader.loadAsync(vendingUrl),
    loader.loadAsync(houseUrl),
    loader.loadAsync(gaitouUrl),
  ])
  return { player, denchu, hei, vending, house, gaitou }
}
