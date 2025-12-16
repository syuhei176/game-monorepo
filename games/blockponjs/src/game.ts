import { Player } from "./entities/Player";
import { Ball } from "./entities/Ball";
import { BoxManager } from "./entities/BoxManager";
import { ProgressManager } from "./managers/ProgressManager";
import { InputManager } from "./managers/InputManager";
import { PhaseManager } from "./managers/PhaseManager";

export class Game {
  private stage: any;
  private mainLayer: any;
  private player: Player;
  private ball: Ball;
  private boxManager: BoxManager;
  private progressManager: ProgressManager;
  private inputManager: InputManager;
  private phaseManager: PhaseManager;
  private browserSize = {
    width: window.innerWidth || document.body.clientWidth,
    height: window.innerHeight || document.body.clientHeight,
  };

  constructor() {
    // @ts-ignore - acgraph is loaded globally from graphicsjs
    this.stage = acgraph.create("stage-container", "100%", "100%");
    this.mainLayer = this.stage.layer();
    this.mainLayer.translate(0, 20);

    // Setup stage background first
    const stageRect = this.stage.rect(30, 30, 340, 640);
    stageRect.fill("#303030");
    stageRect.stroke("#707070");
    this.mainLayer.addChild(stageRect);

    // Initialize managers
    this.progressManager = new ProgressManager(this.stage, this.mainLayer);

    // Initialize entities (they will be added to mainLayer)
    this.player = new Player(this.stage, this.mainLayer);
    this.ball = new Ball(this.stage, this.mainLayer);
    this.boxManager = new BoxManager(this.stage, this.mainLayer);

    // Initialize remaining managers
    this.inputManager = new InputManager(this.player.getState());
    this.phaseManager = new PhaseManager(this.stage, this.mainLayer);

    // Setup touch listeners and scaling
    this.inputManager.setupTouchListeners(stageRect);

    // Apply scaling
    const scaleFactor = Math.min(
      this.browserSize.width / 500,
      this.browserSize.height / 700,
    );
    this.mainLayer.scale(scaleFactor, scaleFactor, 0, 0);

    this.start();
  }

  private start() {
    this.phaseManager.showStartScreen(() => this.startGame());
    this.gameLoop();
  }

  private startGame() {
    this.phaseManager.hideStartScreen();
    this.phaseManager.setPhase("main");

    this.progressManager.resetScore();
    const stage = this.progressManager.getCurrentStage();
    this.ball.setSpeed(1.5 + stage * 0.5);
    this.boxManager.reset(stage);
    this.ball.reset();
    this.player.reset();
  }

  private gameLoop() {
    const phase = this.phaseManager.getCurrentPhase();

    switch (phase) {
      case "start":
        break;
      case "main":
        this.updateGame();
        break;
      case "gameover":
      case "gameclear":
        break;
    }

    window.requestAnimationFrame(() => this.gameLoop());
  }

  private updateGame() {
    // Update player
    const playerState = this.inputManager.getPlayerState();
    this.player.update(playerState);

    // Update ball
    this.ball.update(
      this.player.getState(),
      () => this.checkBoxCollision(),
      () => this.onPaddleHit(),
      () => this.onGameOver(),
    );

    // Check if all boxes are destroyed
    if (this.boxManager.isAllBoxesDestroyed()) {
      this.onGameClear();
    }
  }

  private checkBoxCollision(): boolean {
    return this.boxManager.checkCollision(this.ball.getState(), () => {
      this.progressManager.addScore();
    });
  }

  private onPaddleHit() {
    this.progressManager.resetChain();
  }

  private onGameOver() {
    this.phaseManager.showGameOver(() => this.startGame());
  }

  private onGameClear() {
    this.progressManager.checkAndSaveHighScore();
    const currentStage = this.progressManager.getCurrentStage();
    const score = this.progressManager.getScore();

    // Added a check for max stages, assuming 3 for now.
    if (currentStage >= 3) {
      this.phaseManager.showAllStagesClear(score, () => this.startGame());
    } else {
      this.progressManager.advanceStage();
      this.phaseManager.showStageClear(currentStage, () => this.startGame());
    }
  }
}
