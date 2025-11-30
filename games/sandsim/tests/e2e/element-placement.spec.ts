import { test, expect } from "@playwright/test";

test.describe("Sandsim Element Placement", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should have all element buttons", async ({ page }) => {
    const buttons = ["sand", "water", "soil", "lava", "fire", "seed", "plant"];

    for (const buttonId of buttons) {
      const button = page.locator(`#${buttonId}`);
      await expect(button).toBeVisible();
    }
  });

  test("should change selected element when button is clicked", async ({
    page,
  }) => {
    const selected = page.locator("#selected");

    // Initial should be Sand
    await expect(selected).toHaveText("Sand");

    // Click Water button
    await page.click("#water");
    await expect(selected).toHaveText("Water");

    // Click Fire button
    await page.click("#fire");
    await expect(selected).toHaveText("Fire");

    // Click back to Sand
    await page.click("#sand");
    await expect(selected).toHaveText("Sand");
  });

  test("should place sand element on canvas click", async ({ page }) => {
    const canvas = page.locator("#sample");

    // Make sure Sand is selected
    await page.click("#sand");

    // Click on canvas at position (100, 100)
    // Note: position is relative to element, including border
    await canvas.click({ position: { x: 100, y: 100 } });

    // Wait for the sand to fall
    await page.waitForTimeout(100);

    // Pause animation and get current state
    const stageData = await page.evaluate(() => {
      (window as any).pauseAnimation = true;
      const stage = (window as any).stage;
      if (!stage) return "stage not found";
      // Check a 5x5 area around the click and scan downward
      const result: any = {};
      for (let i = 48; i <= 52; i++) {
        for (let j = 48; j < 300; j++) {
          if (stage[i] && stage[i][j] !== 0) {
            result[`[${i}][${j}]`] = stage[i][j];
          }
        }
      }
      return result;
    });

    // Sand should have fallen to the bottom
    // Check that we have at least one non-empty cell
    expect(Object.keys(stageData).length).toBeGreaterThan(0);

    // Get the first non-empty cell position
    const firstKey = Object.keys(stageData)[0];
    const match = firstKey.match(/\[(\d+)\]\[(\d+)\]/);
    expect(match).not.toBeNull();

    const x = parseInt(match![1]);
    const y = parseInt(match![2]);

    // Get pixel data at the sand's actual position
    const pixelData = await page.evaluate(
      async (coords) => {
        const canvas = document.getElementById("sample") as HTMLCanvasElement;
        const ctx = canvas.getContext("2d")!;
        // Convert stage coordinates to pixel coordinates (multiply by 2)
        const imgData = ctx.getImageData(coords.x * 2, coords.y * 2, 1, 1);
        return Array.from(imgData.data);
      },
      { x, y },
    );

    // Sand color is RGB(200, 180, 100)
    // Check if the pixel is sand color (not background)
    expect(pixelData[0]).toBeGreaterThan(100); // Red channel
    expect(pixelData[1]).toBeGreaterThan(100); // Green channel
    expect(pixelData[2]).toBeLessThan(150); // Blue channel should be low
  });

  test("should place water element on canvas click", async ({ page }) => {
    const canvas = page.locator("#sample");

    // Select Water
    await page.click("#water");

    // Click on canvas
    await canvas.click({ position: { x: 150, y: 150 } });

    // Wait for water to fall
    await page.waitForTimeout(100);

    // Pause animation and get current state
    const stageData = await page.evaluate(() => {
      (window as any).pauseAnimation = true;
      const stage = (window as any).stage;
      if (!stage) return "stage not found";
      // Check area around the click
      const result: any = {};
      for (let i = 70; i <= 80; i++) {
        for (let j = 70; j < 300; j++) {
          if (stage[i] && stage[i][j] !== 0) {
            result[`[${i}][${j}]`] = stage[i][j];
          }
        }
      }
      return result;
    });

    // Water should exist somewhere
    expect(Object.keys(stageData).length).toBeGreaterThan(0);

    // Get the first non-empty cell position
    const firstKey = Object.keys(stageData)[0];
    const match = firstKey.match(/\[(\d+)\]\[(\d+)\]/);
    expect(match).not.toBeNull();

    const x = parseInt(match![1]);
    const y = parseInt(match![2]);

    // Get pixel data at the water's actual position
    const pixelData = await page.evaluate(
      async (coords) => {
        const canvas = document.getElementById("sample") as HTMLCanvasElement;
        const ctx = canvas.getContext("2d")!;
        const imgData = ctx.getImageData(coords.x * 2, coords.y * 2, 1, 1);
        return Array.from(imgData.data);
      },
      { x, y },
    );

    // Water color is RGB(120, 120, 210)
    expect(pixelData[2]).toBeGreaterThan(150); // Blue channel should be high
  });

  test("should place all elements", async ({ page }) => {
    const canvas = page.locator("#sample");
    const elements = [
      { button: "sand", name: "Sand" },
      { button: "water", name: "Water" },
      { button: "soil", name: "Soil" },
      { button: "lava", name: "Lava" },
      { button: "fire", name: "Fire" },
      { button: "seed", name: "Seed" },
      { button: "plant", name: "Plant" },
    ];

    for (let i = 0; i < elements.length; i++) {
      const { button, name } = elements[i];

      // Select element
      await page.click(`#${button}`);

      // Verify it's selected
      const selected = page.locator("#selected");
      await expect(selected).toHaveText(name);

      // Click on canvas at different positions
      const x = 100 + i * 50;
      const y = 100 + i * 20;
      await canvas.click({ position: { x, y } });

      // Wait a moment
      await page.waitForTimeout(50);
    }

    // All elements should have been placed (visual check via screenshot)
    await expect(canvas).toHaveScreenshot("all-elements-placed.png", {
      maxDiffPixels: 1000,
    });
  });

  test("sand should fall down", async ({ page }) => {
    const canvas = page.locator("#sample");

    // Place sand near the top
    await page.click("#sand");
    await canvas.click({ position: { x: 300, y: 100 } });

    // Wait for physics to occur (sand should fall)
    await page.waitForTimeout(500);

    // Pause and check where sand ended up
    const result = await page.evaluate(async () => {
      (window as any).pauseAnimation = true;
      const stage = (window as any).stage;
      const canvas = document.getElementById("sample") as HTMLCanvasElement;
      const ctx = canvas.getContext("2d")!;

      // Find where sand is in the stage
      let sandPosition = null;
      for (let i = 145; i <= 155; i++) {
        for (let j = 0; j < 300; j++) {
          if (stage[i] && stage[i][j] === 1) {
            // 1 is SAND
            sandPosition = { i, j };
            break;
          }
        }
        if (sandPosition) break;
      }

      if (!sandPosition) {
        return { found: false };
      }

      // Check pixel at sand position
      const sandPixel = ctx.getImageData(
        sandPosition.i * 2,
        sandPosition.j * 2,
        1,
        1,
      );

      // Check original position (should be empty now)
      const topPixel = ctx.getImageData(300, 100, 1, 1);

      return {
        found: true,
        sandY: sandPosition.j,
        sandPixel: Array.from(sandPixel.data),
        topPixel: Array.from(topPixel.data),
      };
    });

    // Sand should have been found
    expect(result.found).toBeTruthy();

    // Sand should have fallen down (y position should be greater than 50)
    expect(result.sandY).toBeGreaterThan(50);

    // Top should be empty (background color)
    expect(result.topPixel[0]).toBe(50);
    expect(result.topPixel[1]).toBe(50);
    expect(result.topPixel[2]).toBe(50);

    // Sand pixel should be sand color
    expect(result.sandPixel[0]).toBeGreaterThan(100);
  });
});
