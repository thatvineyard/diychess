import { EngineOptions, Scene, SceneOptions } from "@babylonjs/core";
import { createCamera } from "./camera";
import { DebugInfo } from "./debugInfo";

export const FRAMES_PER_SECOND = 60;

export class GameEngine {
  public engineOptions: EngineOptions
  public sceneOptions: SceneOptions
  public debugInfo?: DebugInfo
  public antialias: boolean 
  public adaptToDeviceRatio: boolean 
  public onUpdate: (scene: Scene) => void
  public onStart: (scene: Scene) => void
  
  constructor(onRender: (scene: Scene) => void, onSceneReady: (scene: Scene) => void) {
    this.engineOptions = {};
    this.sceneOptions = {};
    this.antialias = true;
    this.adaptToDeviceRatio = true;
    this.onUpdate = onRender;
    this.onStart = onSceneReady;
  }

  public start(scene: Scene) {
    this.onStart(scene);
    createCamera(scene);
    // this.debugInfo = new DebugInfo(scene);
  }

  public update(scene: Scene) {
    this.onUpdate(scene);
  }

}