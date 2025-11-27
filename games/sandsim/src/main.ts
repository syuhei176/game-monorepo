const EMPTY = 0;
const SAND = 1;
const WATER = 2;
const SOIL = 3;
const LAVA = 4;

type PowderType =
  | typeof EMPTY
  | typeof SAND
  | typeof WATER
  | typeof SOIL
  | typeof LAVA;

const width = 300;
const height = 300;
let stage = initStage();
let isMouseDown = false;
let selectedPowderType: PowderType = SAND;

function initStage(): PowderType[][] {
  const stage: PowderType[][] = [];
  for (let i = 0; i < width; i++) {
    stage[i] = Array(height);
    stage[i].fill(EMPTY);
  }
  return stage;
}

function putPowder(x: number, y: number, powder: PowderType): void {
  stage[x][y] = powder;
}

function updatePowder(
  i: number,
  j: number,
  stage: PowderType[][],
  nextStage: PowderType[][],
  powder: PowderType,
  maxP: number,
): void {
  if (j < height) {
    if (
      (stage[i][j] === WATER && stage[i][j + 1] === LAVA) ||
      (stage[i][j + 1] === WATER && stage[i][j] === LAVA)
    ) {
      nextStage[i][j] = SAND;
      nextStage[i][j + 1] = SAND;
      return;
    }

    for (let p = 0; p < maxP; p++) {
      if (i + p >= width || j + p >= height) break;
      if (i - p < 0 || j - p < 0) break;

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

    for (let p = 0; p < maxP; p++) {
      if (i + p >= width || j + p >= height) break;
      if (i - p < 0 || j - p < 0) break;

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

    if (nextStage[i][j] === EMPTY) {
      nextStage[i][j] = powder;
    }
  }
}

function update(stage: PowderType[][]): PowderType[][] {
  const nextStage = initStage();
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      let viscosity = 0;
      if (stage[i][j] === SAND) {
        viscosity = 2;
      } else if (stage[i][j] === WATER) {
        viscosity = 20;
      } else if (stage[i][j] === SOIL) {
        viscosity = 1;
      } else if (stage[i][j] === LAVA) {
        viscosity = 5;
      }
      if (viscosity > 0) {
        updatePowder(i, j, stage, nextStage, stage[i][j], viscosity);
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

        const indexes = [
          4 * (size * i + size * j * w),
          4 * (size * i + 1 + size * j * w),
          4 * (size * i + (size * j + 1) * w),
          4 * (size * i + 1 + (size * j + 1) * w),
        ];

        for (let index of indexes) {
          if (powder === EMPTY) {
            imgData.data[index] = 50;
            imgData.data[index + 1] = 50;
            imgData.data[index + 2] = 50;
            imgData.data[index + 3] = 255;
          } else if (powder === SAND) {
            imgData.data[index] = 200;
            imgData.data[index + 1] = 180;
            imgData.data[index + 2] = 100;
            imgData.data[index + 3] = 255;
          } else if (powder === WATER) {
            imgData.data[index] = 120;
            imgData.data[index + 1] = 120;
            imgData.data[index + 2] = 210;
            imgData.data[index + 3] = 255;
          } else if (powder === SOIL) {
            imgData.data[index] = 100;
            imgData.data[index + 1] = 100;
            imgData.data[index + 2] = 100;
            imgData.data[index + 3] = 255;
          } else {
            imgData.data[index] = 200;
            imgData.data[index + 1] = 70;
            imgData.data[index + 2] = 70;
            imgData.data[index + 3] = 255;
          }
        }
      }
    }

    context.putImageData(imgData, 0, 0);
  }
}

window.onload = function () {
  const selected = document.getElementById("selected")!;
  document.getElementById("sand")!.onclick = function () {
    selectedPowderType = SAND;
    selected.innerText = "Sand";
  };
  document.getElementById("water")!.onclick = function () {
    selectedPowderType = WATER;
    selected.innerText = "Water";
  };
  document.getElementById("soil")!.onclick = function () {
    selectedPowderType = SOIL;
    selected.innerText = "Soil";
  };
  document.getElementById("lava")!.onclick = function () {
    selectedPowderType = LAVA;
    selected.innerText = "Lava";
  };

  function updateScreen(): void {
    stage = update(stage);
    draw(stage);
    requestAnimationFrame(updateScreen);
  }
  requestAnimationFrame(updateScreen);
};

// Mouse events
window.onmousedown = function () {
  isMouseDown = true;
};

window.onmousemove = function (e: MouseEvent) {
  const target = e.target as HTMLElement;
  const rect = target.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isMouseDown) {
    putPowder(Math.floor(x / 2), Math.floor(y / 2), selectedPowderType);
  }
};

window.onmouseup = function () {
  isMouseDown = false;
};

// Touch events for mobile/tablet support
window.ontouchstart = function (e: TouchEvent) {
  e.preventDefault();
  isMouseDown = true;
};

window.ontouchmove = function (e: TouchEvent) {
  e.preventDefault();
  const touch = e.touches[0];
  const target = touch.target as HTMLElement;
  const rect = target.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  if (isMouseDown) {
    putPowder(Math.floor(x / 2), Math.floor(y / 2), selectedPowderType);
  }
};

window.ontouchend = function (e: TouchEvent) {
  e.preventDefault();
  isMouseDown = false;
};
