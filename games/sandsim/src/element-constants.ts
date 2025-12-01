// Element constants
export const EMPTY = 0;
export const SAND = 1;
export const WATER = 2;
export const SOIL = 3;
export const LAVA = 4;
export const FIRE = 5;
export const SEED = 6;
export const PLANT = 7;
export const STEAM = 8;

export type PowderType =
  | typeof EMPTY
  | typeof SAND
  | typeof WATER
  | typeof SOIL
  | typeof LAVA
  | typeof FIRE
  | typeof SEED
  | typeof PLANT
  | typeof STEAM;
