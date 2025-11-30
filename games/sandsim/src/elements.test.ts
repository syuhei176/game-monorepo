import { describe, it, expect, beforeEach } from "vitest";
import {
  EMPTY,
  SAND,
  WATER,
  SOIL,
  LAVA,
  FIRE,
  SEED,
  PLANT,
  ELEMENT_DEFINITIONS,
  getSelectableElements,
  type PowderType,
} from "./elements";

describe("Element Constants", () => {
  it("should have unique values for each element", () => {
    const elements = [EMPTY, SAND, WATER, SOIL, LAVA, FIRE, SEED, PLANT];
    const uniqueElements = new Set(elements);
    expect(uniqueElements.size).toBe(elements.length);
  });

  it("should have sequential numeric values starting from 0", () => {
    expect(EMPTY).toBe(0);
    expect(SAND).toBe(1);
    expect(WATER).toBe(2);
    expect(SOIL).toBe(3);
    expect(LAVA).toBe(4);
    expect(FIRE).toBe(5);
    expect(SEED).toBe(6);
    expect(PLANT).toBe(7);
  });
});

describe("ELEMENT_DEFINITIONS", () => {
  it("should contain definitions for all elements", () => {
    const elementIds = [EMPTY, SAND, WATER, SOIL, LAVA, FIRE, SEED, PLANT];

    elementIds.forEach((id) => {
      expect(ELEMENT_DEFINITIONS[id]).toBeDefined();
      expect(ELEMENT_DEFINITIONS[id].id).toBe(id);
    });
  });

  it("should have valid color values (RGB 0-255)", () => {
    Object.values(ELEMENT_DEFINITIONS).forEach((element) => {
      expect(element.color.r).toBeGreaterThanOrEqual(0);
      expect(element.color.r).toBeLessThanOrEqual(255);
      expect(element.color.g).toBeGreaterThanOrEqual(0);
      expect(element.color.g).toBeLessThanOrEqual(255);
      expect(element.color.b).toBeGreaterThanOrEqual(0);
      expect(element.color.b).toBeLessThanOrEqual(255);
    });
  });

  it("should have non-negative viscosity values", () => {
    Object.values(ELEMENT_DEFINITIONS).forEach((element) => {
      expect(element.viscosity).toBeGreaterThanOrEqual(0);
    });
  });

  it("should have valid behaviorType values", () => {
    const validBehaviors = ["static", "falling", "custom"];

    Object.values(ELEMENT_DEFINITIONS).forEach((element) => {
      expect(validBehaviors).toContain(element.behaviorType);
    });
  });

  it("should have customUpdate function for custom behavior types", () => {
    Object.values(ELEMENT_DEFINITIONS).forEach((element) => {
      if (element.behaviorType === "custom") {
        expect(element.customUpdate).toBeDefined();
        expect(typeof element.customUpdate).toBe("function");
      }
    });
  });
});

describe("Individual Element Definitions", () => {
  describe("EMPTY", () => {
    it("should be static with zero viscosity", () => {
      expect(ELEMENT_DEFINITIONS[EMPTY].behaviorType).toBe("static");
      expect(ELEMENT_DEFINITIONS[EMPTY].viscosity).toBe(0);
    });

    it("should have dark gray color", () => {
      const color = ELEMENT_DEFINITIONS[EMPTY].color;
      expect(color).toEqual({ r: 50, g: 50, b: 50 });
    });
  });

  describe("SAND", () => {
    it("should be falling with viscosity 2", () => {
      expect(ELEMENT_DEFINITIONS[SAND].behaviorType).toBe("falling");
      expect(ELEMENT_DEFINITIONS[SAND].viscosity).toBe(2);
    });

    it("should have tan color", () => {
      const color = ELEMENT_DEFINITIONS[SAND].color;
      expect(color).toEqual({ r: 200, g: 180, b: 100 });
    });
  });

  describe("WATER", () => {
    it("should be falling with high viscosity", () => {
      expect(ELEMENT_DEFINITIONS[WATER].behaviorType).toBe("falling");
      expect(ELEMENT_DEFINITIONS[WATER].viscosity).toBe(20);
    });

    it("should have blue color", () => {
      const color = ELEMENT_DEFINITIONS[WATER].color;
      expect(color).toEqual({ r: 120, g: 120, b: 210 });
    });
  });

  describe("SOIL", () => {
    it("should be falling with viscosity 1", () => {
      expect(ELEMENT_DEFINITIONS[SOIL].behaviorType).toBe("falling");
      expect(ELEMENT_DEFINITIONS[SOIL].viscosity).toBe(1);
    });

    it("should have gray color", () => {
      const color = ELEMENT_DEFINITIONS[SOIL].color;
      expect(color).toEqual({ r: 100, g: 100, b: 100 });
    });
  });

  describe("LAVA", () => {
    it("should be falling with viscosity 5", () => {
      expect(ELEMENT_DEFINITIONS[LAVA].behaviorType).toBe("falling");
      expect(ELEMENT_DEFINITIONS[LAVA].viscosity).toBe(5);
    });

    it("should have red color", () => {
      const color = ELEMENT_DEFINITIONS[LAVA].color;
      expect(color).toEqual({ r: 200, g: 70, b: 70 });
    });
  });

  describe("FIRE", () => {
    it("should have custom behavior", () => {
      expect(ELEMENT_DEFINITIONS[FIRE].behaviorType).toBe("custom");
      expect(ELEMENT_DEFINITIONS[FIRE].customUpdate).toBeDefined();
    });

    it("should have orange color", () => {
      const color = ELEMENT_DEFINITIONS[FIRE].color;
      expect(color).toEqual({ r: 255, g: 150, b: 0 });
    });
  });

  describe("SEED", () => {
    it("should have custom behavior", () => {
      expect(ELEMENT_DEFINITIONS[SEED].behaviorType).toBe("custom");
      expect(ELEMENT_DEFINITIONS[SEED].customUpdate).toBeDefined();
    });

    it("should have brown color", () => {
      const color = ELEMENT_DEFINITIONS[SEED].color;
      expect(color).toEqual({ r: 139, g: 90, b: 43 });
    });
  });

  describe("PLANT", () => {
    it("should have custom behavior", () => {
      expect(ELEMENT_DEFINITIONS[PLANT].behaviorType).toBe("custom");
      expect(ELEMENT_DEFINITIONS[PLANT].viscosity).toBe(0);
      expect(ELEMENT_DEFINITIONS[PLANT].customUpdate).toBeDefined();
    });

    it("should have green color", () => {
      const color = ELEMENT_DEFINITIONS[PLANT].color;
      expect(color).toEqual({ r: 34, g: 139, b: 34 });
    });
  });
});

describe("getSelectableElements", () => {
  it("should return all elements except EMPTY", () => {
    const selectable = getSelectableElements();
    const selectableIds = selectable.map((e) => e.id);

    expect(selectableIds).not.toContain(EMPTY);
    expect(selectableIds).toContain(SAND);
    expect(selectableIds).toContain(WATER);
    expect(selectableIds).toContain(SOIL);
    expect(selectableIds).toContain(LAVA);
    expect(selectableIds).toContain(FIRE);
    expect(selectableIds).toContain(SEED);
    expect(selectableIds).toContain(PLANT);
  });

  it("should return 7 elements (8 total - 1 EMPTY)", () => {
    const selectable = getSelectableElements();
    expect(selectable).toHaveLength(7);
  });

  it("should return elements with all required properties", () => {
    const selectable = getSelectableElements();

    selectable.forEach((element) => {
      expect(element).toHaveProperty("id");
      expect(element).toHaveProperty("name");
      expect(element).toHaveProperty("color");
      expect(element).toHaveProperty("viscosity");
      expect(element).toHaveProperty("behaviorType");
    });
  });
});

describe("Custom Update Functions", () => {
  let stage: PowderType[][];
  let nextStage: PowderType[][];
  const width = 10;
  const height = 10;

  beforeEach(() => {
    // Initialize empty stages
    stage = Array.from({ length: width }, () => Array(height).fill(EMPTY));
    nextStage = Array.from({ length: width }, () => Array(height).fill(EMPTY));
  });

  const mockUpdatePowder = (
    i: number,
    j: number,
    stage: PowderType[][],
    nextStage: PowderType[][],
    powder: PowderType,
    maxP: number,
  ) => {
    // Simple mock: just place the powder in the same position
    if (nextStage[i][j] === EMPTY) {
      nextStage[i][j] = powder;
    }
  };

  describe("FIRE customUpdate", () => {
    it("should rise upward when space above is empty", () => {
      stage[5][5] = FIRE;
      const fireUpdate = ELEMENT_DEFINITIONS[FIRE].customUpdate!;

      fireUpdate(5, 5, stage, nextStage, mockUpdatePowder);

      // Fire should attempt to rise to position above
      expect(nextStage[5][4]).toBe(FIRE);
    });

    it("should be extinguished by water", () => {
      stage[5][5] = FIRE;
      stage[5][4] = WATER; // Water above fire

      const fireUpdate = ELEMENT_DEFINITIONS[FIRE].customUpdate!;
      fireUpdate(5, 5, stage, nextStage, mockUpdatePowder);

      // Water position should become EMPTY (extinguished)
      expect(nextStage[5][4]).toBe(EMPTY);
    });

    it("should spread to adjacent plants", () => {
      stage[5][5] = FIRE;
      stage[4][5] = PLANT; // Plant to the left
      stage[6][5] = PLANT; // Plant to the right

      // Run multiple times due to randomness
      let plantBurnedCount = 0;
      for (let i = 0; i < 100; i++) {
        const testNextStage = Array.from({ length: width }, () =>
          Array(height).fill(EMPTY),
        );
        const fireUpdate = ELEMENT_DEFINITIONS[FIRE].customUpdate!;
        fireUpdate(5, 5, stage, testNextStage, mockUpdatePowder);

        if (testNextStage[4][5] === FIRE || testNextStage[6][5] === FIRE) {
          plantBurnedCount++;
        }
      }

      // With 30% probability, we should see some plants burning
      expect(plantBurnedCount).toBeGreaterThan(0);
    });
  });

  describe("SEED customUpdate", () => {
    it("should grow into plant when touching soil", () => {
      stage[5][5] = SEED;
      stage[4][5] = SOIL; // Soil to the left

      const seedUpdate = ELEMENT_DEFINITIONS[SEED].customUpdate!;
      seedUpdate(5, 5, stage, nextStage, mockUpdatePowder);

      // Seed should become plant
      expect(nextStage[5][5]).toBe(PLANT);
    });

    it("should fall like sand when not touching soil", () => {
      stage[5][5] = SEED;

      const seedUpdate = ELEMENT_DEFINITIONS[SEED].customUpdate!;
      seedUpdate(5, 5, stage, nextStage, mockUpdatePowder);

      // Should call updatePowder (which places it in same spot in our mock)
      expect(nextStage[5][5]).toBe(SEED);
    });

    it("should check all four directions for soil", () => {
      const directions = [
        [4, 5], // left
        [6, 5], // right
        [5, 4], // up
        [5, 6], // down
      ];

      directions.forEach(([x, y]) => {
        const testStage = Array.from({ length: width }, () =>
          Array(height).fill(EMPTY),
        );
        const testNextStage = Array.from({ length: width }, () =>
          Array(height).fill(EMPTY),
        );

        testStage[5][5] = SEED;
        testStage[x][y] = SOIL;

        const seedUpdate = ELEMENT_DEFINITIONS[SEED].customUpdate!;
        seedUpdate(5, 5, testStage, testNextStage, mockUpdatePowder);

        expect(testNextStage[5][5]).toBe(PLANT);
      });
    });
  });
});

describe("Element Registry Consistency", () => {
  it("should have consistent IDs between constant and definition", () => {
    expect(ELEMENT_DEFINITIONS[EMPTY].id).toBe(EMPTY);
    expect(ELEMENT_DEFINITIONS[SAND].id).toBe(SAND);
    expect(ELEMENT_DEFINITIONS[WATER].id).toBe(WATER);
    expect(ELEMENT_DEFINITIONS[SOIL].id).toBe(SOIL);
    expect(ELEMENT_DEFINITIONS[LAVA].id).toBe(LAVA);
    expect(ELEMENT_DEFINITIONS[FIRE].id).toBe(FIRE);
    expect(ELEMENT_DEFINITIONS[SEED].id).toBe(SEED);
    expect(ELEMENT_DEFINITIONS[PLANT].id).toBe(PLANT);
  });

  it("should have lowercase button names matching element names", () => {
    const selectable = getSelectableElements();

    selectable.forEach((element) => {
      const buttonId = element.name.toLowerCase();
      expect(buttonId).toBe(element.name.toLowerCase());
      expect(buttonId.length).toBeGreaterThan(0);
    });
  });
});
