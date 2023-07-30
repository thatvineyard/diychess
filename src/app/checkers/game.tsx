import { Color3, Engine, HemisphericLight, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import GameCanvas from "./gameCanvas";
import { resetCamera } from "./engine/camera";
import { GameEngine } from "./engine/engine";
import { GameGui } from "./gui/gui";
import { Board } from "./board/board";

enum State { START = 0, PLAYER_TURN = 1, CPU_TURN = 2, PLAYER_WIN = 3, CPU_WIN = 4 }

class GameMachine {
  // General Entire Application
  private _scene: Scene;
  private _canvas: HTMLCanvasElement;
  private _engine: Engine;

  constructor() {
  }

}

type Box = {
  position: { y: number, x: number },
  rotation: { y: number }
}

let box: Box;

let frames = 0;

const onSceneReady = (scene: Scene) => {
  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  // Our built-in 'box' shape.s
  // box = MeshBuilder.CreateBox("box", { size: 2 }, scene);


  // Move the box upward 1/2 its height
  // box.position.y = 1;

  // Our built-in 'ground' shape.

  let board = new Board('board', scene);

  let gameGui = new GameGui(scene);
  gameGui.registerAction("button_reset_cam", () => resetCamera(scene));
};


/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
const onRender = (scene: Scene) => {
  // if (box !== undefined) {
  //   const deltaTimeInMillis = scene.getEngine().getDeltaTime();

  //   const rpm = 10;
  //   box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
  // }
  frames++;
};

export default function Game() {
  var gameEngine = new GameEngine(onRender, onSceneReady);

  return (
    <GameCanvas gameEngine={gameEngine} id="my-canvas" />
  )
}
