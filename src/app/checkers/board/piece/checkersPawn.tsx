import { Action, ActionManager, Animation, BounceEase, CircleEase, EasingFunction, ExecuteCodeAction, Material, Nullable, PredicateCondition, Scene, Sound, Space, Vector2, Vector3 } from "@babylonjs/core";
import { InstancedMesh, Mesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { FRAMES_PER_SECOND, GameEngine } from "../../engine/engine";
import { Board } from "../board";
import { Square } from "../square";
import { CancelMove, CaptureMove, Move, MovementMove } from "./move";
import { GameManager } from "../../gameManager";
import { Player, PlayerSide } from "../../player";
import { PieceMaterialGroup } from "../../engine/materialManager";
import { Piece } from "./piece";
import { SelectAround, SelectDiagonalExtents } from "../squareSelectionRule";

const LIFT_HEIGHT = 1;
const PLACED_HEIGHT = 0.05;
const MESH_SCALE = 0.85;
enum State { NOT_DEFINED, LIFTED, PLACED }

export class CheckersPawn extends Piece {

  private moveSelectionRule = new SelectDiagonalExtents(this.board, 1);
  // private moveSelectionRule = new SelectAround(this.board, 1);

  constructor(owner: Player, board: Board, square: Square, gameManager: GameManager, gameEngine: GameEngine) {
    super(owner, board, square, gameManager, gameEngine);
  }

  createMesh(): Mesh {
    const diameter = Math.min(this.board.getSquareSize().y, this.board.getSquareSize().x) * MESH_SCALE;
    return MeshBuilder.CreateCylinder('pawn', { height: 0.1, diameter }, this.gameEngine.scene);
  }

  getMaterialGroup(): PieceMaterialGroup {
    return this.owner.playerSide == PlayerSide.WHITE ?
      this.gameEngine.materialManager!.whitePawnMaterialGroup
      : this.gameEngine.materialManager!.blackPawnMaterialGroup;
  }
  
  protected getPickupSound(): Sound {
    return new Sound("POP", "./sfx/comedy_bubble_pop_003.mp3", this.gameEngine.scene, null, { loop: false, autoplay: false, volume: 0.3 });
  }

  // 
  // 

  public calcAvailableMoves() {
    this.availableMoves = new Map();
    let distance = 1;
    this.board.foreachSquare((square: Square) => {
      if(this.moveSelectionRule.select(square.coordinate, this.currentSquare.coordinate)) {
        if (square.hasPawn()) {
          if (square.getPawn()!.canBePlayedBy(this.gameManager.getCurrentPlayer())) {
            return false;
          } else {
            this.availableMoves.set(square.coordinate.toString(), { move: new CaptureMove(square), instance: undefined });
            return;
          }
        }
        this.availableMoves.set(square.coordinate.toString(), { move: new MovementMove(square), instance: undefined });
        return;
      }
    });

    this.availableMoves.set(this.currentSquare.coordinate.toString(), { move: new CancelMove(this.currentSquare), instance: undefined });
  }
}

class CheckersCaptureMove extends CaptureMove {

  constructor(target: Square, captureSquare: Square) {
    super(target);

    this.captureSquare = captureSquare;

  }

}