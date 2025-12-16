import { GamePhase } from "../types";

export class PhaseManager {
  private currentPhase: GamePhase = "start";
  private startRect: any = null;
  private startText: any = null;

  constructor(
    private stage: any,
    private mainLayer: any,
  ) {}

  getCurrentPhase(): GamePhase {
    return this.currentPhase;
  }

  showStartScreen(onStart: () => void) {
    this.startRect = this.stage.rect(120, 350, 160, 30);
    this.startText = this.stage.text(145, 350, "Game Start", {
      fontSize: 20,
      fontColor: "#ffffff",
    });

    this.startRect.fill("#313131", 0.5);
    this.startRect.stroke("#707070", 0.5);
    this.mainLayer.addChild(this.startRect);
    this.mainLayer.addChild(this.startText);

    this.startRect.listen("click", onStart);
    this.startText.listen("click", onStart);

    this.currentPhase = "start";
  }

  hideStartScreen() {
    if (this.startRect) {
      this.startRect.remove();
      this.startRect = null;
    }
    if (this.startText) {
      this.startText.remove();
      this.startText = null;
    }
  }

  showGameOver(onRestart: () => void) {
    const gameoverRect = this.stage.rect(120, 350, 160, 30);
    gameoverRect.fill("#aaa", 0.5);
    const gameoverText = this.stage.text(145, 350, "Game Over", {
      fontSize: 20,
      fontColor: "#ffffff",
    });
    this.mainLayer.addChild(gameoverRect);
    this.mainLayer.addChild(gameoverText);

    const restart = () => {
      gameoverRect.remove();
      gameoverText.remove();
      onRestart();
    };

    gameoverRect.listen("click", restart);
    gameoverText.listen("click", restart);

    this.currentPhase = "gameover";
  }

  showGameClear(score: number, onRestart: () => void) {
    const gameclearRect = this.stage.rect(100, 350, 200, 30);
    gameclearRect.fill("#aaa", 0.5);
    const gameclearText = this.stage.text(120, 350, `Game Clear ${score}`, {
      fontSize: 20,
      fontColor: "#ffffff",
    });
    this.mainLayer.addChild(gameclearRect);
    this.mainLayer.addChild(gameclearText);

    const restart = () => {
      gameclearRect.remove();
      gameclearText.remove();
      onRestart();
    };

    gameclearRect.listen("click", restart);
    gameclearText.listen("click", restart);

    this.currentPhase = "gameclear";
  }

  setPhase(phase: GamePhase) {
    this.currentPhase = phase;
  }
}
