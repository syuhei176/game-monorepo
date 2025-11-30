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

// Interaction result - what elements should become after interaction
export interface InteractionResult {
  element1: PowderType; // What the first element becomes
  element2: PowderType; // What the second element becomes
  skipProcessing?: boolean; // Should we skip normal element processing?
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

type UpdateFunction = (
  i: number,
  j: number,
  stage: PowderType[][],
  nextStage: PowderType[][],
  updatePowder: (
    i: number,
    j: number,
    stage: PowderType[][],
    nextStage: PowderType[][],
    powder: PowderType,
    maxP: number,
  ) => void,
) => void;

export interface ElementDefinition {
  id: PowderType;
  name: string;
  color: RGB;
  viscosity: number;
  behaviorType: "static" | "falling" | "custom";
  customUpdate?: UpdateFunction;
}

// Custom update function for fire
function updateFireElement(
  i: number,
  j: number,
  stage: PowderType[][],
  nextStage: PowderType[][],
  updatePowder: any,
): void {
  const width = stage.length;
  const height = stage[0].length;

  // Fire rises up
  if (j > 0 && stage[i][j - 1] === EMPTY) {
    nextStage[i][j - 1] = FIRE;
    // Fire has a chance to disappear as it rises
    if (Math.random() < 0.02) {
      return;
    }
  } else if (j > 0 && stage[i][j - 1] === WATER) {
    // Water extinguishes fire
    nextStage[i][j - 1] = EMPTY;
    return;
  } else {
    // Fire stays briefly then disappears
    if (Math.random() < 0.02) {
      return;
    }
    nextStage[i][j] = FIRE;
  }

  // Fire spreads to adjacent plants
  const directions = [
    [i - 1, j],
    [i + 1, j],
    [i, j - 1],
    [i, j + 1],
  ];
  for (const [x, y] of directions) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      if (stage[x][y] === PLANT && Math.random() < 0.3) {
        nextStage[x][y] = FIRE;
      }
    }
  }
}

// Custom update function for plant
function updatePlantElement(
  i: number,
  j: number,
  stage: PowderType[][],
  nextStage: PowderType[][],
  updatePowder: any,
): void {
  const width = stage.length;
  const height = stage[0].length;

  // Plant stays in place
  nextStage[i][j] = PLANT;

  // Count nearby plants to limit growth
  let nearbyPlants = 0;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      const x = i + dx;
      const y = j + dy;
      if (
        x >= 0 &&
        x < width &&
        y >= 0 &&
        y < height &&
        stage[x][y] === PLANT
      ) {
        nearbyPlants++;
      }
    }
  }

  // Check if there's water nearby (encourages growth)
  let hasWaterNearby = false;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const x = i + dx;
      const y = j + dy;
      if (
        x >= 0 &&
        x < width &&
        y >= 0 &&
        y < height &&
        stage[x][y] === WATER
      ) {
        hasWaterNearby = true;
        break;
      }
    }
    if (hasWaterNearby) break;
  }

  // Don't grow if too crowded (more than 8 plants nearby)
  if (nearbyPlants > 8) {
    return;
  }

  // Growth probabilities (higher with water)
  const upwardGrowthChance = hasWaterNearby ? 0.03 : 0.01;
  const horizontalGrowthChance = hasWaterNearby ? 0.015 : 0.005;

  // Plant grows upward (j - 1 is above)
  if (
    j > 0 &&
    stage[i][j - 1] === EMPTY &&
    Math.random() < upwardGrowthChance
  ) {
    nextStage[i][j - 1] = PLANT;
  }

  // Also spread horizontally occasionally
  if (
    i > 0 &&
    stage[i - 1][j] === EMPTY &&
    Math.random() < horizontalGrowthChance
  ) {
    nextStage[i - 1][j] = PLANT;
  }
  if (
    i < width - 1 &&
    stage[i + 1][j] === EMPTY &&
    Math.random() < horizontalGrowthChance
  ) {
    nextStage[i + 1][j] = PLANT;
  }
}

// Custom update function for seed
function updateSeedElement(
  i: number,
  j: number,
  stage: PowderType[][],
  nextStage: PowderType[][],
  updatePowder: any,
): void {
  const width = stage.length;
  const height = stage[0].length;

  // Check if seed is touching soil
  const directions = [
    [i - 1, j],
    [i + 1, j],
    [i, j - 1],
    [i, j + 1],
  ];
  for (const [x, y] of directions) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      if (stage[x][y] === SOIL) {
        // Seed grows into plant when touching soil
        console.log(
          `Seed at [${i}][${j}] found soil at [${x}][${y}], growing into plant`,
        );
        nextStage[i][j] = PLANT;
        return;
      }
    }
  }

  // Otherwise, seed falls like sand
  updatePowder(i, j, stage, nextStage, SEED, 2);
}

// Custom update function for steam
function updateSteamElement(
  i: number,
  j: number,
  stage: PowderType[][],
  nextStage: PowderType[][],
  updatePowder: any,
): void {
  // Steam rises upward
  if (j > 0 && stage[i][j - 1] === EMPTY) {
    // Steam rises and gradually condenses
    const rand = Math.random();
    if (rand < 0.005) {
      // 0.5% chance to dissipate completely
      return;
    } else if (rand < 0.01) {
      // 0.5% chance to condense to water
      nextStage[i][j - 1] = WATER;
    } else {
      // 99% chance to continue rising as steam
      nextStage[i][j - 1] = STEAM;
    }
    return;
  }

  // Steam blocked by non-empty cell above - mostly condense
  if (j > 0 && stage[i][j - 1] !== EMPTY && stage[i][j - 1] !== STEAM) {
    const rand = Math.random();
    if (rand < 0.05) {
      // 5% chance to dissipate
      return;
    } else if (rand < 0.75) {
      // 70% chance to condense to water
      nextStage[i][j] = WATER;
      return;
    }
    // 25% chance to stay as steam
  }

  // At top boundary - mostly condense
  if (j === 0) {
    if (Math.random() < 0.2) {
      // 20% chance to dissipate into air
      return;
    } else {
      // 80% chance to condense to water
      nextStage[i][j] = WATER;
      return;
    }
  }

  // Stalled steam - gradually condense
  const rand = Math.random();
  if (rand < 0.01) {
    // 1% chance to dissipate
    return;
  } else if (rand < 0.15) {
    // 14% chance to condense to water
    nextStage[i][j] = WATER;
  } else {
    // 85% chance to stay as steam
    nextStage[i][j] = STEAM;
  }
}

// Element registry - single source of truth
export const ELEMENT_DEFINITIONS: Record<PowderType, ElementDefinition> = {
  [EMPTY]: {
    id: EMPTY,
    name: "Empty",
    color: { r: 50, g: 50, b: 50 },
    viscosity: 0,
    behaviorType: "static",
  },
  [SAND]: {
    id: SAND,
    name: "Sand",
    color: { r: 200, g: 180, b: 100 },
    viscosity: 2,
    behaviorType: "falling",
  },
  [WATER]: {
    id: WATER,
    name: "Water",
    color: { r: 120, g: 120, b: 210 },
    viscosity: 20,
    behaviorType: "falling",
  },
  [SOIL]: {
    id: SOIL,
    name: "Soil",
    color: { r: 100, g: 100, b: 100 },
    viscosity: 1,
    behaviorType: "falling",
  },
  [LAVA]: {
    id: LAVA,
    name: "Lava",
    color: { r: 200, g: 70, b: 70 },
    viscosity: 5,
    behaviorType: "falling",
  },
  [FIRE]: {
    id: FIRE,
    name: "Fire",
    color: { r: 255, g: 150, b: 0 },
    viscosity: 0,
    behaviorType: "custom",
    customUpdate: updateFireElement,
  },
  [SEED]: {
    id: SEED,
    name: "Seed",
    color: { r: 139, g: 90, b: 43 },
    viscosity: 2,
    behaviorType: "custom",
    customUpdate: updateSeedElement,
  },
  [PLANT]: {
    id: PLANT,
    name: "Plant",
    color: { r: 34, g: 139, b: 34 },
    viscosity: 0,
    behaviorType: "custom",
    customUpdate: updatePlantElement,
  },
  [STEAM]: {
    id: STEAM,
    name: "Steam",
    color: { r: 200, g: 200, b: 200 },
    viscosity: 0,
    behaviorType: "custom",
    customUpdate: updateSteamElement,
  },
};

// Helper to get all selectable elements (excluding EMPTY)
export function getSelectableElements(): ElementDefinition[] {
  return Object.values(ELEMENT_DEFINITIONS).filter((e) => e.id !== EMPTY);
}

// Special interactions registry - defines how elements interact with each other
// Key format: "elementA_elementB" where elementA <= elementB (sorted)
type InteractionMap = Map<string, InteractionResult>;

const INTERACTIONS: InteractionMap = new Map([
  // Water + Lava = Steam + Sand (water evaporates, lava cools to sand)
  // Key format: smaller ID first (WATER=2, LAVA=4)
  [`${WATER}_${LAVA}`, { element1: STEAM, element2: SAND }],

  // Lava + Plant = Lava + Fire (plant burns, lava stays)
  // Key format: smaller ID first (LAVA=4, PLANT=7)
  [
    `${LAVA}_${PLANT}`,
    { element1: LAVA, element2: FIRE, skipProcessing: true },
  ],

  // Water + Fire = Steam + Fire (water evaporates)
  // Key format: smaller ID first (WATER=2, FIRE=5)
  [`${WATER}_${FIRE}`, { element1: STEAM, element2: FIRE }],
]);

// Helper to create consistent interaction key (sorted)
function getInteractionKey(element1: PowderType, element2: PowderType): string {
  return element1 <= element2
    ? `${element1}_${element2}`
    : `${element2}_${element1}`;
}

// Check if two elements have a special interaction
export function checkInteraction(
  element1: PowderType,
  element2: PowderType,
): InteractionResult | null {
  const key = getInteractionKey(element1, element2);
  const interaction = INTERACTIONS.get(key);

  if (!interaction) {
    return null;
  }

  // Return the interaction with elements in the correct order
  if (element1 <= element2) {
    return interaction;
  } else {
    // Swap if elements were reversed
    return {
      element1: interaction.element2,
      element2: interaction.element1,
      skipProcessing: interaction.skipProcessing,
    };
  }
}
