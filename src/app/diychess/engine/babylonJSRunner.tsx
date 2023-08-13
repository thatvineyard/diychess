import BabylonJSCanvas from "./babylonJSCanvas";
import { GameEngine } from "./gameEngine";

export default function BabylonJSRunner() {
  var gameEngine = new GameEngine();

  return (
    <BabylonJSCanvas gameEngine={gameEngine} id="my-canvas" />
  )
}
