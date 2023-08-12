import { GameEngine } from "./engine";

export class EngineAware {

  protected gameEngine: GameEngine;

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
  }

  private getScene() {
    return this.gameEngine.scene;
  }
}