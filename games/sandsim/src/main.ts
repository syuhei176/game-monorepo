import {
  EMPTY,
  SAND,
  WATER,
  SOIL,
  LAVA,
  FIRE,
  SEED,
  PLANT,
  type PowderType,
  ELEMENT_DEFINITIONS,
  getSelectableElements,
} from "./elements";

const width = 300;
const height = 300;
let stage = initStage();
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

      // Special interaction: lava + water = sand
      if (j < height - 1) {
        if (
          (stage[i][j] === WATER && stage[i][j + 1] === LAVA) ||
          (stage[i][j + 1] === WATER && stage[i][j] === LAVA)
        ) {
          nextStage[i][j] = SAND;
          nextStage[i][j + 1] = SAND;
          continue;
        }
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

  function updateScreen(): void {
    if (!(window as any).pauseAnimation) {
      stage = update(stage);
      (window as any).stage = stage; // Update window reference for debugging
      draw(stage);
    }
    requestAnimationFrame(updateScreen);
  }
  requestAnimationFrame(updateScreen);

  // Mouse events - attach to canvas only
  canvas.onmousedown = function (e: MouseEvent) {
    isMouseDown = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    putPowder(Math.floor(x / 2), Math.floor(y / 2), selectedPowderType);
  };

  canvas.onmousemove = function (e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isMouseDown) {
      putPowder(Math.floor(x / 2), Math.floor(y / 2), selectedPowderType);
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
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      putPowder(Math.floor(x / 2), Math.floor(y / 2), selectedPowderType);
    },
    { passive: false },
  );

  canvas.addEventListener(
    "touchmove",
    function (e: TouchEvent) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (isMouseDown) {
        putPowder(Math.floor(x / 2), Math.floor(y / 2), selectedPowderType);
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
