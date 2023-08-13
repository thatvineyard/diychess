import { Board } from "../board";
import { Square } from "../square";
import { CancelMove, CaptureMove, Move, MoveOptions, MoveTag, MovementMove } from "./move";
import { GameManager } from "../../gameManager";
import { Piece } from "./piece";
import { SquareSelectionRuleSet } from "../squareSelectionRuleSet";
import { SelectDiagonalExtents, SelectDiagonalExtentsWithCurrentPlayersPieceBetween, SelectDiagonalExtentsWithOtherThanCurrentPlayersPieceBetween, SelectDiagonalExtentsWithPieceBetween, SelectEmptySquare } from "../squareSelectionRule";
import { checkSquaresBetweenSquaresOnDiagonals } from "../boardUtils";
import { Player, PlayerSide } from "../../player/player";
import { Mesh, MeshBuilder, Sound, Vector2 } from "@babylonjs/core";
import { GameEngine } from "@/app/diychess/engine/gameEngine";
import { PieceMaterialGroup } from "@/app/diychess/engine/materialManager";

const LIFT_HEIGHT = 1;
const PLACED_HEIGHT = 0.05;
const MESH_SCALE = 0.85;
enum State { NOT_DEFINED, LIFTED, PLACED }

export class CheckersPawn extends Piece {

  private regularMoveRuleSet = new SquareSelectionRuleSet();
  private jumpMoveRuleSet = new SquareSelectionRuleSet();
  private captureRuleSet = new SquareSelectionRuleSet();

  constructor(owner: Player, board: Board, square: Square, gameManager: GameManager, gameEngine: GameEngine) {
    super(owner, board, square, gameManager, gameEngine);

    this.regularMoveRuleSet.addAdditiveRule(new SelectDiagonalExtents(board, 1));
    this.regularMoveRuleSet.addMaskingRule(new SelectEmptySquare(board));

    this.jumpMoveRuleSet.addAdditiveRule(new SelectDiagonalExtentsWithCurrentPlayersPieceBetween(board, 2, owner));
    this.jumpMoveRuleSet.addMaskingRule(new SelectEmptySquare(board));

    this.captureRuleSet.addAdditiveRule(new SelectDiagonalExtentsWithOtherThanCurrentPlayersPieceBetween(board, 2, owner));
    this.captureRuleSet.addMaskingRule(new SelectEmptySquare(board));
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
    return new Sound("POP", "./sfx/comedy_bubble_pop_003.mp3", this.gameEngine.scene, null, { loop: false, autoplay: false, volume: 0.05 });
  }

  // 
  // 

  public calcAvailableMoves(squareMask: Vector2[] = [], moveTagFilter: MoveTag[] = []) {
    this.availableMoves = new Map();
    this.board.foreachSquare((square: Square) => {
      if (squareMask.length > 0 && squareMask.includes(square.coordinate)) {
        return;
      }

      if (moveTagFilter.length == 0 || moveTagFilter.filter(tag => tag == MoveTag.MOVEMENT).length > 0) {
        if (this.regularMoveRuleSet.checkSquare(square.coordinate, this.currentSquare.coordinate)) {
          this.availableMoves.set(square.coordinate.toString(), { move: new MovementMove(this, this.currentSquare, square), instance: undefined });
          return;
        }
      }

      if (moveTagFilter.length == 0 || moveTagFilter.filter(tag => tag == MoveTag.MOVEMENT || tag == MoveTag.JUMP).length > 0) {
        if (this.jumpMoveRuleSet.checkSquare(square.coordinate, this.currentSquare.coordinate)) {
          this.availableMoves.set(square.coordinate.toString(), { move: new CheckersJumpMove(this, this.currentSquare, square, { doNotEndTurn: true }), instance: undefined });
          return;
        }
      }

      if (moveTagFilter.length == 0 || moveTagFilter.filter(tag => tag == MoveTag.CAPTURE || tag == MoveTag.JUMP).length > 0) {
        if (this.captureRuleSet.checkSquare(square.coordinate, this.currentSquare.coordinate)) {
          var target: Square | undefined;

          checkSquaresBetweenSquaresOnDiagonals((square) => {
            if (target != null) {
              return;
            }

            let piece = square.getPawn();
            if (piece != null && piece.owner.name != this.owner.name) {
              target = square;
            }
          }, this.board, this.currentSquare.coordinate, square.coordinate);

          if (!target) {
            throw new Error("Could not find target when creating checkers capture move");
          }

          this.availableMoves.set(square.coordinate.toString(), { move: new CheckersCaptureMove(this, this.currentSquare, square, target), instance: undefined });
          return;
        }
      }
    });

    if (moveTagFilter.length == 0 || moveTagFilter.filter(tag => tag == MoveTag.CANCEL).length > 0) {
      this.availableMoves.set(this.currentSquare.coordinate.toString(), { move: new CancelMove(this, this.currentSquare, this.currentSquare), instance: undefined });
    }
  }
}

const CAPTURE_MOVE_OPTIONS: MoveOptions = {
  doNotEndTurn: true,
}

export class CheckersCaptureMove extends CaptureMove {
  protected moveTags: MoveTag[] = [...this.moveTags, MoveTag.JUMP];

  constructor(piece: Piece, origin: Square, target: Square, captureSquare: Square, options?: MoveOptions) {
    if (!options) {
      options = CAPTURE_MOVE_OPTIONS;
    }
    super(piece, origin, target, options);

    this.captureSquare = captureSquare;

  }

}

export class CheckersJumpMove extends MovementMove {
  protected moveTags: MoveTag[] = [...this.moveTags, MoveTag.JUMP];

  constructor(piece: Piece, origin: Square, target: Square, options?: MoveOptions) {
    super(piece, origin, target, options);

  }

}