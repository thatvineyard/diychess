import { Engine, EngineOptions, Nullable, RuntimeError, Scene, SceneOptions } from "@babylonjs/core";
import { createCamera } from "./camera";
import { DebugInfo } from "./debugInfo";
import { MaterialManager } from "./materialManager";

export class GameEngine {
  public engineOptions: EngineOptions
  public sceneOptions: SceneOptions
  public debugInfo?: DebugInfo
  public antialias: boolean
  public adaptToDeviceRatio: boolean
  public onUpdate: (gameEngine: GameEngine) => void
  public onStart: (gameEngine: GameEngine) => void
  public materialManager?: MaterialManager;
  public scene!: Scene;
  public babylonEngine!: Engine;
  readonly FRAMES_PER_SECOND = 60;

  constructor(onRender: (gameEngine: GameEngine) => void, onSceneReady: (gameEngine: GameEngine) => void) {
    this.engineOptions = {};
    this.sceneOptions = {};
    this.antialias = true;
    this.adaptToDeviceRatio = true;
    this.onUpdate = onRender;
    this.onStart = onSceneReady;
  }

  public start(canvas: Nullable<HTMLCanvasElement | OffscreenCanvas | WebGLRenderingContext | WebGL2RenderingContext>) {

    this.babylonEngine = new Engine(canvas, this.antialias, this.engineOptions, this.adaptToDeviceRatio);
    this.scene = new Scene(this.babylonEngine, this.sceneOptions);

    
    
    if (this.scene.isReady()) {
      this.postSceneLoad(this.scene);
    } else {
      this.scene.onReadyObservable.addOnce((scene) => this.postSceneLoad(scene));
    }

    this.babylonEngine.runRenderLoop(() => {
      this.update();
    });
  }
  
  private postSceneLoad(scene: Scene) {
    this.materialManager = new MaterialManager(this);
    this.onStart(this);
    createCamera(scene);
    // this.debugInfo = new DebugInfo(scene);
  }

  public update() {
    if (this.scene == null) {
      throw new Error("update() ran before start()");
    }
    this.scene.render();
    this.onUpdate(this);
  }

  public resize() {
    this.babylonEngine.resize();
  }

}