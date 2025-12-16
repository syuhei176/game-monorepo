export class ScoreManager {
  private score: number = 0;
  private scoreChain: number = 0;
  private highScore: number = 0;
  private scoreText: any;
  private highScoreText: any;

  constructor(
    private stage: any,
    mainLayer: any,
  ) {
    this.highScore = this.loadScore();
    this.scoreText = stage.text(30, 10, `Score ${this.score}`, {
      fontColor: "#ffffff",
      fontSize: 20,
    });
    this.highScoreText = stage.text(220, 10, `High score ${this.highScore}`, {
      fontColor: "#ffffff",
      fontSize: 20,
    });
    mainLayer.addChild(this.scoreText);
    mainLayer.addChild(this.highScoreText);
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

  getScoreChain(): number {
    return this.scoreChain;
  }

  resetScore() {
    this.score = 0;
    this.scoreChain = 0;
    this.updateScoreDisplay();
  }

  checkAndSaveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveScore(this.score);
      this.highScoreText.text(`High score ${this.highScore}`);
    }
  }

  private updateScoreDisplay() {
    this.scoreText.text(`Score ${this.score}`);
  }

  private saveScore(score: number) {
    localStorage.setItem("score", JSON.stringify({ score }));
  }

  private loadScore(): number {
    const result = localStorage.getItem("score");
    if (result) {
      try {
        return JSON.parse(result).score;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }
}
