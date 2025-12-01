// Re-export element constants
export {
  EMPTY,
  SAND,
  WATER,
  SOIL,
  LAVA,
  FIRE,
  SEED,
  PLANT,
  STEAM,
  type PowderType,
} from "./element-constants";

import {
  EMPTY,
  SAND,
  WATER,
  SOIL,
  LAVA,
  FIRE,
  SEED,
  PLANT,
  STEAM,
  type PowderType,
} from "./element-constants";

// Interaction result - what elements should become after interaction
export interface InteractionResult {
  element1: PowderType; // What the first element becomes
  element2: PowderType; // What the second element becomes
  skipProcessing?: boolean; // Should we skip normal element processing?
}

export interface RGB {
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

// Import DSL definitions and compiler
import {
  ELEMENT_DSL_DEFINITIONS,
  INTERACTION_DSL_DEFINITIONS,
} from "./elements-dsl-definitions";
import { compileElements, compileInteractions } from "./element-dsl-compiler";

// Element registry - compiled from DSL definitions
export const ELEMENT_DEFINITIONS: Record<PowderType, ElementDefinition> =
  compileElements(ELEMENT_DSL_DEFINITIONS, [
    EMPTY,
    SAND,
    WATER,
    SOIL,
    LAVA,
    FIRE,
    SEED,
    PLANT,
    STEAM,
  ]);

// Helper to get all selectable elements (excluding EMPTY)
export function getSelectableElements(): ElementDefinition[] {
  return Object.values(ELEMENT_DEFINITIONS).filter((e) => e.id !== EMPTY);
}

// Create name-to-id mapping for interactions
const NAME_TO_ID = new Map<string, PowderType>([
  ["Empty", EMPTY],
  ["Sand", SAND],
  ["Water", WATER],
  ["Soil", SOIL],
  ["Lava", LAVA],
  ["Fire", FIRE],
  ["Seed", SEED],
  ["Plant", PLANT],
  ["Steam", STEAM],
]);

// Compile interactions from DSL definitions
type InteractionMap = Map<string, InteractionResult>;
const INTERACTIONS: InteractionMap = compileInteractions(
  INTERACTION_DSL_DEFINITIONS,
  NAME_TO_ID,
);

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
