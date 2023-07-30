import { AxesViewer, Scene } from "@babylonjs/core";
import { Inspector } from "@babylonjs/inspector";
import { AdvancedDynamicTexture } from "babylonjs-gui";

export class DebugInfo {
  private axesViewer: AxesViewer;
  private guiTexture: AdvancedDynamicTexture;

  constructor(scene: Scene) {
    this.axesViewer = new AxesViewer(scene, 5);
    // this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("debugGUI");
    // Inspector.Show(scene, {});
    Inspector.Show(scene, {
      overlay: true,
      embedMode: true,
    });
  }
}