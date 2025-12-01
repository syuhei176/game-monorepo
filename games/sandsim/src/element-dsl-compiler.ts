import type {
  DSLElementDefinition,
  InteractionDefinition,
  Condition,
  Action,
  BehaviorRule,
  Direction,
  SpreadRule,
  GrowthRule,
} from "./element-dsl";
import type { PowderType } from "./element-constants";
import type { ElementDefinition, InteractionResult } from "./elements";
import { EMPTY, WATER, PLANT, STEAM } from "./element-constants";

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

// Helper functions for condition checking
function checkCondition(
  condition: Condition,
  i: number,
  j: number,
  stage: PowderType[][],
): boolean {
  const width = stage.length;
  const height = stage[0].length;

  if (typeof condition === "string") {
    switch (condition) {
      case "above_is_empty":
        return j > 0 && stage[i][j - 1] === EMPTY;
      case "below_is_empty":
        return j < height - 1 && stage[i][j + 1] === EMPTY;
      case "left_is_empty":
        return i > 0 && stage[i - 1][j] === EMPTY;
      case "right_is_empty":
        return i < width - 1 && stage[i + 1][j] === EMPTY;
      case "above_is_water":
        return j > 0 && stage[i][j - 1] === WATER;
      case "above_is_blocked":
        // Check if above is blocked by non-empty, non-steam cell
        if (j > 0) {
          const aboveCell = stage[i][j - 1];
          return aboveCell !== EMPTY && aboveCell !== STEAM;
        }
        return false;
      case "at_top_boundary":
        return j === 0;
      case "at_bottom_boundary":
        return j === height - 1;
      case "has_water_nearby":
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
              return true;
            }
          }
        }
        return false;
      case "not_too_crowded":
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
        return nearbyPlants <= 8;
      default:
        return false;
    }
  } else if ("adjacent_is" in condition) {
    const directions = [
      [i - 1, j],
      [i + 1, j],
      [i, j - 1],
      [i, j + 1],
    ];
    for (const [x, y] of directions) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if (stage[x][y] === condition.adjacent_is) {
          return true;
        }
      }
    }
    return false;
  } else if ("above_is" in condition) {
    return j > 0 && stage[i][j - 1] === condition.above_is;
  } else if ("below_is" in condition) {
    return j < height - 1 && stage[i][j + 1] === condition.below_is;
  }

  return false;
}

// Helper to get coordinates for direction
function getDirectionCoords(
  direction: Direction,
  i: number,
  j: number,
): [number, number] {
  switch (direction) {
    case "above":
      return [i, j - 1];
    case "below":
      return [i, j + 1];
    case "left":
      return [i - 1, j];
    case "right":
      return [i + 1, j];
  }
}

// Execute an action
function executeAction(
  action: Action,
  i: number,
  j: number,
  stage: PowderType[][],
  nextStage: PowderType[][],
  currentElement: PowderType,
): boolean {
  const width = stage.length;
  const height = stage[0].length;

  switch (action.type) {
    case "moveTo": {
      const [x, y] = getDirectionCoords(action.direction, i, j);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        nextStage[x][y] = currentElement;
        return true;
      }
      return false;
    }
    case "set": {
      const [x, y] = getDirectionCoords(action.direction, i, j);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        nextStage[x][y] = action.element;
      }
      return false;
    }
    case "disappear":
      // Don't set anything in nextStage
      return true;
    case "stay":
      nextStage[i][j] = currentElement;
      return true;
    case "become":
      nextStage[i][j] = action.element;
      return true;
    case "fall":
      // Fall action should not be executed directly
      return false;
  }
}

// Apply spread rules
function applySpreadRules(
  spreadRules: SpreadRule[],
  i: number,
  j: number,
  stage: PowderType[][],
  nextStage: PowderType[][],
): void {
  const width = stage.length;
  const height = stage[0].length;

  for (const rule of spreadRules) {
    const directions = [
      [i - 1, j],
      [i + 1, j],
      [i, j - 1],
      [i, j + 1],
    ];

    for (const [x, y] of directions) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if (
          stage[x][y] === rule.targetElement &&
          Math.random() < rule.probability
        ) {
          nextStage[x][y] = rule.becomeElement;
        }
      }
    }
  }
}

// Apply growth rules
function applyGrowthRules(
  growthRules: GrowthRule[],
  i: number,
  j: number,
  stage: PowderType[][],
  nextStage: PowderType[][],
  currentElement: PowderType,
): void {
  const width = stage.length;
  const height = stage[0].length;

  for (const rule of growthRules) {
    // Check limit condition first
    if (rule.limit) {
      if (rule.limit.type === "nearby_plants") {
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
        if (nearbyPlants > rule.limit.max) {
          continue;
        }
      }
    }

    // Calculate effective probability with modifiers
    let effectiveProbability = rule.probability;
    if (rule.modifiers) {
      for (const modifier of rule.modifiers) {
        if (checkCondition(modifier.condition, i, j, stage)) {
          effectiveProbability *= modifier.factor;
        }
      }
    }

    // Check condition if specified
    if (rule.condition && !checkCondition(rule.condition, i, j, stage)) {
      continue;
    }

    // Apply growth based on direction
    if (Math.random() < effectiveProbability) {
      if (rule.direction === "upward") {
        if (j > 0 && stage[i][j - 1] === EMPTY) {
          nextStage[i][j - 1] = currentElement;
        }
      } else if (rule.direction === "horizontal") {
        // Try both left and right
        if (i > 0 && stage[i - 1][j] === EMPTY) {
          nextStage[i - 1][j] = currentElement;
        }
        if (i < width - 1 && stage[i + 1][j] === EMPTY) {
          nextStage[i + 1][j] = currentElement;
        }
      }
    }
  }
}

// Compile DSL behavior to update function
function compileBehavior(
  dslDef: DSLElementDefinition,
  elementId: PowderType,
): UpdateFunction | undefined {
  const { behavior } = dslDef;

  if (behavior.type === "falling" || behavior.type === "static") {
    return undefined; // These are handled by the default behavior
  }

  // Compile custom behavior
  return (i, j, stage, nextStage, updatePowder) => {
    let actionTaken = false;

    // Process rules
    if (behavior.rules) {
      // Collect all matching rules with their actions
      const matchingActions: Array<{ action: Action; probability: number }> =
        [];
      let hasOtherwiseRule = false;

      for (const rule of behavior.rules) {
        // Check condition
        if (rule.condition) {
          if (checkCondition(rule.condition, i, j, stage)) {
            matchingActions.push(...rule.actions);
          }
        } else {
          // Otherwise rule - save for later
          hasOtherwiseRule = true;
          if (matchingActions.length === 0) {
            matchingActions.push(...rule.actions);
          }
        }
      }

      // Calculate total probability and select one action probabilistically
      if (matchingActions.length > 0) {
        const totalProbability = matchingActions.reduce(
          (sum, a) => sum + a.probability,
          0,
        );
        let random = Math.random() * totalProbability;

        for (const { action, probability } of matchingActions) {
          random -= probability;
          if (random <= 0) {
            if (executeAction(action, i, j, stage, nextStage, elementId)) {
              actionTaken = true;
            }
            break;
          }
        }
      }
    }

    // Apply spread rules
    if (behavior.spreadRules) {
      applySpreadRules(behavior.spreadRules, i, j, stage, nextStage);
    }

    // Apply growth rules
    if (behavior.growthRules) {
      applyGrowthRules(behavior.growthRules, i, j, stage, nextStage, elementId);
    }

    // If no action was taken, use fallback behavior
    if (!actionTaken) {
      // If there's a viscosity defined, use falling behavior
      if (behavior.viscosity !== undefined && behavior.viscosity > 0) {
        updatePowder(i, j, stage, nextStage, elementId, behavior.viscosity);
      } else if (nextStage[i][j] === EMPTY) {
        // Otherwise stay in place by default
        nextStage[i][j] = elementId;
      }
    }
  };
}

// Compile DSL element definition to runtime element definition
export function compileElement(
  dslDef: DSLElementDefinition,
  elementId: PowderType,
): ElementDefinition {
  const { name, color, behavior } = dslDef;

  return {
    id: elementId,
    name,
    color,
    viscosity: behavior.viscosity || 0,
    behaviorType: behavior.type,
    customUpdate: compileBehavior(dslDef, elementId),
  };
}

// Compile all DSL elements to runtime definitions
export function compileElements(
  dslDefinitions: DSLElementDefinition[],
  elementIds: PowderType[],
): Record<PowderType, ElementDefinition> {
  const compiled: Record<PowderType, ElementDefinition> = {} as Record<
    PowderType,
    ElementDefinition
  >;

  dslDefinitions.forEach((dslDef, index) => {
    const elementId = elementIds[index];
    compiled[elementId] = compileElement(dslDef, elementId);
  });

  return compiled;
}

// Compile interaction definitions
export function compileInteractions(
  dslInteractions: InteractionDefinition[],
  nameToId: Map<string, PowderType>,
): Map<string, InteractionResult> {
  const interactions = new Map<string, InteractionResult>();

  for (const interaction of dslInteractions) {
    const id1 = nameToId.get(interaction.element1);
    const id2 = nameToId.get(interaction.element2);

    if (id1 === undefined || id2 === undefined) {
      console.warn(
        `Interaction references unknown element: ${interaction.element1} or ${interaction.element2}`,
      );
      continue;
    }

    const key = id1 <= id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
    interactions.set(key, {
      element1: interaction.result1,
      element2: interaction.result2,
      skipProcessing: interaction.skipProcessing,
    });
  }

  return interactions;
}
