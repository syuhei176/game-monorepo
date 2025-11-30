// Element constants
export const EMPTY = 0;
export const SAND = 1;
export const WATER = 2;
export const SOIL = 3;
export const LAVA = 4;
export const FIRE = 5;
export const SEED = 6;
export const PLANT = 7;

export type PowderType =
  | typeof EMPTY
  | typeof SAND
  | typeof WATER
  | typeof SOIL
  | typeof LAVA
  | typeof FIRE
  | typeof SEED
  | typeof PLANT;

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
    if (Math.random() < 0.1) {
      return;
    }
  } else if (j > 0 && stage[i][j - 1] === WATER) {
    // Water extinguishes fire
    nextStage[i][j - 1] = EMPTY;
    return;
  } else {
    // Fire stays briefly then disappears
    if (Math.random() < 0.05) {
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
};

// Helper to get all selectable elements (excluding EMPTY)
export function getSelectableElements(): ElementDefinition[] {
  return Object.values(ELEMENT_DEFINITIONS).filter((e) => e.id !== EMPTY);
}

// Special interactions registry - defines how elements interact with each other
// Key format: "elementA_elementB" where elementA <= elementB (sorted)
type InteractionMap = Map<string, InteractionResult>;

const INTERACTIONS: InteractionMap = new Map([
  // Lava + Water = Sand + Sand
  [`${LAVA}_${WATER}`, { element1: SAND, element2: SAND }],

  // Lava + Plant = Lava + Fire (plant burns, lava stays)
  [
    `${LAVA}_${PLANT}`,
    { element1: LAVA, element2: FIRE, skipProcessing: true },
  ],
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
