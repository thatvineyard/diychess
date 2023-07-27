import { Action, ActionManager, Color3, Engine, EngineOptions, ExecuteCodeAction, HemisphericLight, Mesh, MeshBuilder, Scene, SceneOptions, Sound, StandardMaterial, Vector2, Vector3 } from "@babylonjs/core";
import GameCanvas from "./gameCanvas";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { createCamera, resetCamera } from "./engine/camera";
import { GameEngine } from "./engine/engine";
import { GameGui } from "./gui/gui";

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
  box = MeshBuilder.CreateBox("box", { size: 2 }, scene);


  // Move the box upward 1/2 its height
  box.position.y = 1;

  // Our built-in 'ground' shape.
  let boardMat = new StandardMaterial("boardMat", scene);
  boardMat.diffuseColor = Color3.FromHexString("#522b22");
  let ground = MeshBuilder.CreateBox("board", { width: 10, depth: 10, height: 0.5 }, scene);
  ground.position = Vector3.Up().scale(-0.5 / 2);
  ground.material = boardMat;


  const whiteMaterial = new StandardMaterial("White");
  whiteMaterial.diffuseColor = Color3.FromHexString("#d4f0d3");

  const blackMaterial = new StandardMaterial("Black");
  blackMaterial.diffuseColor = Color3.FromHexString("#17171d");

  function createTile(position: Vector2, positionOffset: Vector2, size: Vector2, material: StandardMaterial): Mesh {
    const box = MeshBuilder.CreateBox(`${position.x}:${position.y}`, { height: 0.05, width: size.x, depth: size.y });
    box.material = material;
    position = position.add(positionOffset);
    box.position = new Vector3(position.x + size.x / 2, 0, position.y + size.y / 2);
    return box;
  }

  function createBoard(tiles: Vector2, size: Vector2, tileManager: ActionManager) {
    var material: StandardMaterial;
    var positionOffset = size.scale(-0.5);
    var position = Vector2.Zero();
    var tileSize = size.divide(tiles);
    var tile: Mesh;
    for (let row = 0; row < tiles.x; row++) {
      position.x = 0;
      for (let col = 0; col < tiles.y; col++) {
        if (row % 2 === col % 2) {
          material = whiteMaterial;
        } else {
          material = blackMaterial;
        }
        tile = createTile(position, positionOffset, tileSize, material);
        tile.actionManager = tileManager;
        position.x += tileSize.x;
      }
      position.y += tileSize.y;
    }
  }

  const sound = new Sound("POP", "./sfx/comedy_bubble_pop_003.mp3", scene, null, { loop: false, autoplay: false });

  let tileManager = new ActionManager(scene);
  tileManager.registerAction(
    new ExecuteCodeAction({
      trigger: ActionManager.OnPickTrigger,
    }, 
    () => { sound.play(); }
    )
  )


  createBoard(new Vector2(8, 8), new Vector2(8, 8), tileManager);

  let gameGui = new GameGui(scene);
  gameGui.registerAction("button_reset_cam", () => resetCamera(scene));
};


/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
const onRender = (scene: Scene) => {
  if (box !== undefined) {
    const deltaTimeInMillis = scene.getEngine().getDeltaTime();

    const rpm = 10;
    box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
  }
  frames++;
};

export default function Game() {
  var gameEngine = new GameEngine(onRender, onSceneReady);

  return (
    <GameCanvas gameEngine={gameEngine} id="my-canvas" />
  )
}
