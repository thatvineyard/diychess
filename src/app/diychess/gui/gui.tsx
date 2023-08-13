import { Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import * as guiTexture from "./guiTexture.json";
import { GameManager } from "../game/gameManager";
import { GameEngine } from "../engine/gameEngine";
import { resetCamera } from "../engine/camera";
import { Player } from "../game/player/player";
import { Round } from "../game/round";


export class GameGui {
  public advancedTexture: AdvancedDynamicTexture;
  private gameManager: GameManager;
  private gameEngine: GameEngine;

  constructor(gameManager: GameManager, gameEngine: GameEngine) {
    this.gameManager = gameManager;
    this.gameEngine = gameEngine;
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("GUI", true, this.gameEngine.scene);
    this.advancedTexture.parseSerializedObject(guiTexture, true);

    
    this.registerAction("button_reset_cam", () => resetCamera(this.gameEngine.scene!));
    this.registerAction("button_reset_game", () => {
      this.gameManager.reset();
    });
  }

  public update() {
    this.setTurnPlayerText(this.gameManager.getCurrentPlayer());
    this.setRoundNumberText(this.gameManager.getRound()!);
  }

  registerAction(name: string, callback: () => void) {
    let button = this.advancedTexture.getControlByName(name);
    button?.onPointerClickObservable.add(callback);
  }

  setTurnPlayerText(player: Player) {
    let text = this.advancedTexture.getControlByName("turn_player_text");
    if (text instanceof TextBlock) {
      text.text = player.name;
    }
  }

  setRoundNumberText(round: Round) {
    let text = this.advancedTexture.getControlByName("turn_number_text");
    if (text instanceof TextBlock) {
      text.text = `${round.roundNumber}: ${round.activeTurn?.moves[0]?.origin}`;
    }
  }
}