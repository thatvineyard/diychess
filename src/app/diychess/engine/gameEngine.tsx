import { Engine, EngineOptions, HemisphericLight, Nullable, RuntimeError, Scene, SceneOptions, Vector3 } from "@babylonjs/core";
import { createCamera, resetCamera } from "./camera";
import { DebugInfo } from "./debugInfo";
import { MaterialManager } from "./materialManager";
import { GameGui } from "../gui/gui";
import { GameManager } from "../game/gameManager";

export class GameEngine {
  public engineOptions: EngineOptions
  public sceneOptions: SceneOptions
  public debugInfo?: DebugInfo
  public antialias: boolean
  public adaptToDeviceRatio: boolean
  public materialManager?: MaterialManager;
  public scene?: Scene;
  public babylonEngine!: Engine;
  static readonly FRAMES_PER_SECOND = 60;
  public awaitingInput = false;
  private gameGui?: GameGui;
  private gameManager?: GameManager;

  constructor() {
    this.engineOptions = {};
    this.sceneOptions = {};
    this.antialias = true;
    this.adaptToDeviceRatio = true;
  }

  public start(canvas: Nullable<HTMLCanvasElement | OffscreenCanvas | WebGLRenderingContext | WebGL2RenderingContext>) {

    this.babylonEngine = new Engine(canvas, this.antialias, this.engineOptions, this.adaptToDeviceRatio);
    this.scene = new Scene(this.babylonEngine, this.sceneOptions);
    
    if (this.scene.isReady()) {
      this.onSceneLoaded(this.scene);
    } else {
      this.scene.onReadyObservable.addOnce((scene) => this.onSceneLoaded(scene));
    }

    this.babylonEngine.runRenderLoop(() => {
      this.update();
    });
  }
  
  private onSceneLoaded(scene: Scene) {
    if(!this.scene) {
      throw new GameEngineError("scene not properly loaded");
    }
    
    this.materialManager = new MaterialManager(this);
    
    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    this.gameManager = new GameManager(this);
    this.gameGui = new GameGui(this.gameManager, this);


    this.gameManager.startGame();
    
    createCamera(scene);
    // this.debugInfo = new DebugInfo(scene);
  }

  public updateGui() {
    if(!this.gameGui) {
      throw new GameEngineError("Tried updating gui before it was loaded");
    }
    this.gameGui.update();
  }

  public update() {
    if (this.scene == null) {
      throw new Error("update() ran before start()");
    }
    this.scene.render();
  }

  public resize() {
    this.babylonEngine.resize();
  }

}

export class GameEngineError extends Error {}