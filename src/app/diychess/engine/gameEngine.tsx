import { Animatable, Animation, Engine, EngineOptions, HemisphericLight, Nullable, RuntimeError, Scene, SceneOptions, Vector3 } from "@babylonjs/core";
import { createCamera, resetCamera } from "./camera";
import { DebugInfo } from "./debugInfo";
import { MaterialManager } from "./materialManager";
import { GameGui } from "../gui/gui";
import { GameManager } from "../game/gameManager";
import { EnvironmentManager } from "../environment/environmentManager";

export class GameEngine {
  public engineOptions: EngineOptions
  public sceneOptions: SceneOptions
  public debugInfo?: DebugInfo
  public antialias: boolean
  public adaptToDeviceRatio: boolean
  public materialManager?: MaterialManager;
  public environmentManager?: EnvironmentManager;
  public scene?: Scene;
  public babylonEngine?: Engine;
  static readonly FRAMES_PER_SECOND = 60;
  public awaitingInput = false;
  private gameGui?: GameGui;
  public gameManager?: GameManager;

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

    this.babylonEngine.runRenderLoop(() => this.renderLoop());
  }

  private onSceneLoaded(scene: Scene) {
    if (!this.scene) {
      throw new GameEngineError("scene not properly loaded");
    }

    this.materialManager = new MaterialManager(this);
    this.environmentManager = new EnvironmentManager(this);


    this.gameManager = new GameManager(this);
    this.gameGui = new GameGui(this.gameManager, this);


    this.gameManager.setUpGame();


    createCamera(this);

    this.gameManager.startGame();
    // this.debugInfo = new DebugInfo(scene);
  }

  public updateGui() {
    if (!this.gameGui) {
      throw new GameEngineError("Tried updating gui before it was loaded");
    }
    this.gameGui.update();
  }

  private renderLoop() {
    if (this.scene == null || this.gameManager == null) {
      throw new Error("update() ran before start()");
    }
    this.gameManager.renderLoop();
    this.scene.render();
  }

  public resize() {
    if (!this.babylonEngine) {
      throw new GameEngineError("Resize cannot be called until BablyonEngine has been created");
    }
    this.babylonEngine.resize();
  }

  public runAnimation(target: any, animations: Animation[], from: number, to: number, loop?: boolean | undefined, speedRatio?: number | undefined, onAnimationEnd?: (() => void) | undefined, onAnimationLoop?: (() => void) | undefined, isAdditive?: boolean | undefined) {
    if (this.scene == null) {
      throw new Error("runAnimation() ran before start()");
    }
    // this.scene.beginAnimation(target, from, to, loop, speedRatio, onAnimationEnd, animatable, stopCurrent, targetMask, onAnimationLoop, isAdditive);
    this.scene.beginDirectAnimation(target, animations, from, to, loop, speedRatio, onAnimationEnd, onAnimationLoop, isAdditive);

  }

  public stopAnimation(target: any, animationName?: string | undefined, targetMask?: ((target: any) => boolean) | undefined) {
    if (this.scene == null) {
      throw new Error("stopAnimations() ran before start()");
    }

    this.scene.stopAnimation(target, animationName, targetMask);
  }

}

export class GameEngineError extends Error { }