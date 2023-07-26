import { Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import * as guiTexture from "./guiTexture.json";


export class GameGui {
  public advancedTexture: AdvancedDynamicTexture;

  constructor(scene: Scene) {
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("GUI", true, scene);
    this.advancedTexture.parseSerializedObject(guiTexture);
  }

  registerAction(name: string, callback: () => void) {
    let buttonResetCam = this.advancedTexture.getControlByName(name);
    buttonResetCam?.onPointerClickObservable.add(callback);
  }
}