import { Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import * as guiTexture from "./guiTexture.json";
import { Player } from "../player";
import { GameManager } from "../gameManager";


export class GameGui {
  public advancedTexture: AdvancedDynamicTexture;
  private gameManager: GameManager;

  constructor(gameManager: GameManager, scene: Scene) {
    this.gameManager = gameManager;
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("GUI", true, scene);
    this.advancedTexture.parseSerializedObject(guiTexture, true);
    
    this.setPlayerText(this.gameManager.getCurrentPlayer());
    this.gameManager.onNextTurn = () => {
      this.setPlayerText(this.gameManager.getCurrentPlayer());
    }
  }

  registerAction(name: string, callback: () => void) {
    let button = this.advancedTexture.getControlByName(name);
    button?.onPointerClickObservable.add(callback);
  }

  setPlayerText(player: Player) {
    let text = this.advancedTexture.getControlByName("player_turn_text");
    if(text instanceof TextBlock) {
      text.text = player.name;
    }
  }
}