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
  ELEMENT_DEFINITIONS,
  getSelectableElements,
  checkInteraction,
} from "./elements";

const width = 300;
const height = 300;
const SAVE_KEY = "sandsim_save";
let stage = loadStage() || initStage();
let isMouseDown = false;
let selectedPowderType: PowderType = SAND;
let brushSize = 1; // Brush size in grid cells

// Expose for debugging/testing
(window as any).stage = stage;
(window as any).pauseAnimation = false;

function initStage(): PowderType[][] {
  const stage: PowderType[][] = [];
  for (let i = 0; i < width; i++) {
    stage[i] = Array(height);
    stage[i].fill(EMPTY);
  }
  return stage;
}

function saveStage(): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(stage));
  } catch (e) {
    console.error("Failed to save:", e);
  }
}

function loadStage(): PowderType[][] | null {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load:", e);
  }
  return null;
}

function resetStage(): void {
  stage = initStage();
  saveStage();
  (window as any).stage = stage;
}

function putPowder(x: number, y: number, powder: PowderType): void {
  // Apply brush size - draw a circle of powder
  const radius = Math.floor(brushSize / 2);
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      // Check if within circular brush
      if (dx * dx + dy * dy <= radius * radius) {
        const px = x + dx;
        const py = y + dy;
        // Boundary check
        if (px >= 0 && px < width && py >= 0 && py < height) {
          stage[px][py] = powder;
        }
      }
    }
  }
}

function updatePowder(
  i: number,
  j: number,
  stage: PowderType[][],
  nextStage: PowderType[][],
  powder: PowderType,
  maxP: number,
): void {
  // Check if we can fall down (j+1 must be within bounds)
  if (j >= height - 1) {
    // At bottom, stay in place
    if (nextStage[i][j] === EMPTY) {
      nextStage[i][j] = powder;
    }
    return;
  }

  // Try to fall down-right with spread distance `maxP`
  for (let p = 0; p < maxP; p++) {
    if (i + p >= width) break;

    if (stage[i + p][j + 1] === EMPTY) {
      nextStage[i + p][j + 1] = powder;
      return;
    }

    if (powder !== WATER) {
      if (stage[i + p][j + 1] === WATER) {
        nextStage[i + p][j + 1] = powder;
        nextStage[i][j] = WATER;
        return;
      }
    }

    if (stage[i + p][j + 1] !== EMPTY && stage[i + p][j + 1] !== powder) {
      break;
    }
  }

  // Try to fall down-left with spread distance `maxP`
  for (let p = 0; p < maxP; p++) {
    if (i - p < 0) break;

    if (stage[i - p][j + 1] === EMPTY) {
      nextStage[i - p][j + 1] = powder;
      return;
    }

    if (powder !== WATER) {
      if (stage[i - p][j + 1] === WATER) {
        nextStage[i - p][j + 1] = powder;
        nextStage[i][j] = WATER;
        return;
      }
    }

    if (stage[i - p][j + 1] !== EMPTY && stage[i - p][j + 1] !== powder) {
      break;
    }
  }

  // Stay in place if nowhere to fall
  if (nextStage[i][j] === EMPTY) {
    nextStage[i][j] = powder;
  }
}

function update(stage: PowderType[][]): PowderType[][] {
  const nextStage = initStage();
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const powderType = stage[i][j];

      // Skip empty cells - no need to process
      if (powderType === EMPTY) {
        continue;
      }

      const element = ELEMENT_DEFINITIONS[powderType];

      // Check for special interactions with adjacent cells
      let skipProcessing = false;
      const adjacentCells = [
        [i, j - 1], // above
        [i, j + 1], // below
        [i - 1, j], // left
        [i + 1, j], // right
      ];

      for (const [x, y] of adjacentCells) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const adjacentType = stage[x][y];

          // Check if there's a special interaction
          const interaction = checkInteraction(powderType, adjacentType);

          if (interaction) {
            // Apply the interaction results
            if (nextStage[i][j] === EMPTY) {
              nextStage[i][j] = interaction.element1;
            }
            if (nextStage[x][y] === EMPTY) {
              nextStage[x][y] = interaction.element2;
            }

            // Mark to skip normal processing if needed
            if (interaction.skipProcessing) {
              skipProcessing = true;
            }
          }
        }
      }

      // Skip normal processing if interaction requested it
      if (skipProcessing) {
        continue;
      }

      // Dispatch based on behavior type
      if (element.behaviorType === "static") {
        nextStage[i][j] = powderType;
      } else if (element.behaviorType === "falling") {
        updatePowder(i, j, stage, nextStage, powderType, element.viscosity);
      } else if (element.behaviorType === "custom" && element.customUpdate) {
        element.customUpdate(i, j, stage, nextStage, updatePowder);
      }
    }
  }
  return nextStage;
}

function draw(stage: PowderType[][]): void {
  const size = 2;
  const w = width * size;
  const h = height * size;

  const canvas = document.getElementById("sample") as HTMLCanvasElement;
  if (canvas.getContext) {
    const context = canvas.getContext("2d")!;
    const imgData = context.getImageData(0, 0, w, h);

    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        const powder = stage[i][j];
        const element = ELEMENT_DEFINITIONS[powder];
        const { r, g, b } = element.color;

        const indexes = [
          4 * (size * i + size * j * w),
          4 * (size * i + 1 + size * j * w),
          4 * (size * i + (size * j + 1) * w),
          4 * (size * i + 1 + (size * j + 1) * w),
        ];

        for (let index of indexes) {
          imgData.data[index] = r;
          imgData.data[index + 1] = g;
          imgData.data[index + 2] = b;
          imgData.data[index + 3] = 255;
        }
      }
    }

    context.putImageData(imgData, 0, 0);
  }
}

window.onload = function () {
  const selected = document.getElementById("selected")!;
  const canvas = document.getElementById("sample") as HTMLCanvasElement;
  const brushSizeInput = document.getElementById(
    "brushSize",
  ) as HTMLInputElement;
  const brushSizeValue = document.getElementById("brushSizeValue")!;

  // Initialize brush size
  brushSize = parseInt(brushSizeInput.value);

  // Brush size control
  brushSizeInput.oninput = function () {
    brushSize = parseInt(brushSizeInput.value);
    brushSizeValue.innerText = brushSize.toString();
  };

  // Auto-generate button handlers from element registry
  const selectableElements = getSelectableElements();
  const buttons: { [key: string]: HTMLElement } = {};

  for (const element of selectableElements) {
    const buttonId = element.name.toLowerCase();
    const button = document.getElementById(buttonId);

    if (button) {
      buttons[buttonId] = button;

      // Create closure to capture element correctly
      (function (elem, btn, btnId) {
        btn.onclick = function () {
          // Update selected element
          selectedPowderType = elem.id;
          selected.innerText = elem.name;

          // Update button styles
          Object.values(buttons).forEach((b) => b.classList.remove("selected"));
          btn.classList.add("selected");
        };
      })(element, button, buttonId);
    }
  }

  let frameCount = 0;
  function updateScreen(): void {
    if (!(window as any).pauseAnimation) {
      stage = update(stage);
      (window as any).stage = stage; // Update window reference for debugging
      draw(stage);

      // Auto-save every 60 frames (approximately once per second at 60fps)
      frameCount++;
      if (frameCount >= 60) {
        saveStage();
        frameCount = 0;
      }
    }
    requestAnimationFrame(updateScreen);
  }
  requestAnimationFrame(updateScreen);

  // Reset button handler
  const resetButton = document.getElementById("reset");
  if (resetButton) {
    resetButton.onclick = function () {
      if (confirm("リセットしてもよろしいですか？")) {
        resetStage();
      }
    };
  }

  // Helper function to convert screen coordinates to grid coordinates
  function getGridCoordinates(
    clientX: number,
    clientY: number,
  ): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    // Calculate the position relative to the canvas
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    // Calculate the scale factor between displayed size and actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Convert to canvas coordinates
    const actualX = canvasX * scaleX;
    const actualY = canvasY * scaleY;

    // Convert to grid coordinates (canvas is 600x600, grid is 300x300, so divide by 2)
    const gridX = Math.floor(actualX / 2);
    const gridY = Math.floor(actualY / 2);

    return { x: gridX, y: gridY };
  }

  // Mouse events - attach to canvas only
  canvas.onmousedown = function (e: MouseEvent) {
    isMouseDown = true;
    const coords = getGridCoordinates(e.clientX, e.clientY);
    putPowder(coords.x, coords.y, selectedPowderType);
  };

  canvas.onmousemove = function (e: MouseEvent) {
    if (isMouseDown) {
      const coords = getGridCoordinates(e.clientX, e.clientY);
      putPowder(coords.x, coords.y, selectedPowderType);
    }
  };

  canvas.onmouseup = function () {
    isMouseDown = false;
  };

  window.onmouseup = function () {
    isMouseDown = false;
  };

  // Touch events for mobile/tablet support - attach to canvas only
  // Use addEventListener with passive: false to allow preventDefault
  canvas.addEventListener(
    "touchstart",
    function (e: TouchEvent) {
      e.preventDefault();
      isMouseDown = true;
      const touch = e.touches[0];
      const coords = getGridCoordinates(touch.clientX, touch.clientY);
      putPowder(coords.x, coords.y, selectedPowderType);
    },
    { passive: false },
  );

  canvas.addEventListener(
    "touchmove",
    function (e: TouchEvent) {
      e.preventDefault();
      if (isMouseDown) {
        const touch = e.touches[0];
        const coords = getGridCoordinates(touch.clientX, touch.clientY);
        putPowder(coords.x, coords.y, selectedPowderType);
      }
    },
    { passive: false },
  );

  canvas.addEventListener(
    "touchend",
    function (e: TouchEvent) {
      e.preventDefault();
      isMouseDown = false;
    },
    { passive: false },
  );
};
