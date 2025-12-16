export class ProgressManager {
  private score: number = 0;
  private scoreChain: number = 0;
  private highScore: number = 0;
  private stageNum: number = 1;
  private maxStage: number = 1;

  private scoreText: any;
  private highScoreText: any;
  private stageText: any;

  constructor(
    private stage: any,
    mainLayer: any,
  ) {
    this.loadProgress();

    this.scoreText = stage.text(30, 10, `Score ${this.score}`, {
      fontColor: "#ffffff",
      fontSize: 20,
    });
    this.highScoreText = stage.text(220, 10, `High score ${this.highScore}`, {
      fontColor: "#ffffff",
      fontSize: 20,
    });
    this.stageText = stage.text(380, 10, `Stage ${this.stageNum}`, {
      fontColor: "#ffffff",
      fontSize: 20,
    });

    mainLayer.addChild(this.scoreText);
    mainLayer.addChild(this.highScoreText);
    mainLayer.addChild(this.stageText);
  }

  addScore() {
    this.score += Math.pow(2, this.scoreChain);
    this.scoreChain++;
    this.updateScoreDisplay();
  }

  resetChain() {
    this.scoreChain = 0;
  }

  getScore(): number {
    return this.score;
  }

  resetScore() {
    this.score = 0;
    this.scoreChain = 0;
    this.updateScoreDisplay();
  }

  checkAndSaveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveProgress();
      this.highScoreText.text(`High score ${this.highScore}`);
    }
  }

  getCurrentStage(): number {
    return this.stageNum;
  }

  advanceStage() {
    this.stageNum++;
    if (this.stageNum > this.maxStage) {
      this.maxStage = this.stageNum;
    }
    this.saveProgress();
    this.updateStageDisplay();
  }

  private updateScoreDisplay() {
    this.scoreText.text(`Score ${this.score}`);
  }

  private updateStageDisplay() {
    this.stageText.text(`Stage ${this.stageNum}`);
  }

  private saveProgress() {
    const progress = {
      highScore: this.highScore,
      maxStage: this.maxStage,
    };
    localStorage.setItem("blockponjs_progress", JSON.stringify(progress));
  }

  private loadProgress() {
    const result = localStorage.getItem("blockponjs_progress");
    if (result) {
      try {
        const progress = JSON.parse(result);
        this.highScore = progress.highScore || 0;
        this.maxStage = progress.maxStage || 1;
        this.stageNum = this.maxStage;
      } catch (e) {
        this.highScore = 0;
        this.maxStage = 1;
        this.stageNum = 1;
      }
    } else {
      this.highScore = 0;
      this.maxStage = 1;
      this.stageNum = 1;
    }
  }
}
