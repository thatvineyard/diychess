import { HemisphericLight, Vector3 } from "@babylonjs/core";
import { GameManager } from "../game/gameManager";
import { GameGui } from "../gui/gui";
import BabylonJSCanvas from "./babylonJSCanvas";
import { resetCamera } from "./camera";
import { GameEngine } from "./engine";


enum State { START = 0, PLAYER_TURN = 1, CPU_TURN = 2, PLAYER_WIN = 3, CPU_WIN = 4 }

type Box = {
  position: { y: number, x: number },
  rotation: { y: number }
}

let box: Box;

let frames = 0;

const onSceneReady = (gameEngine: GameEngine) => {
  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), gameEngine.scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  let gameManager = new GameManager(gameEngine);

  let gameGui = new GameGui(gameManager, gameEngine.scene);
  gameGui.registerAction("button_reset_cam", () => resetCamera(gameEngine.scene));
  gameGui.registerAction("button_reset_game", () => {
    gameManager.reset();
  });

  gameManager.startTurn();

};


/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
const onRender = (gameEngine: GameEngine) => {
  // frames++;
};

export default function BabylonJSRunner() {
  var gameEngine = new GameEngine(onRender, onSceneReady);

  return (
    <BabylonJSCanvas gameEngine={gameEngine} id="my-canvas" />
  )
}

export class GameRuleError extends Error {}