import { Mesh, Sound, InstancedMesh, Vector2, CircleEase, EasingFunction, BounceEase, ActionManager, Vector3, Space, ExecuteCodeAction, PredicateCondition, Animation } from "@babylonjs/core";
import { GameManager } from "../../gameManager";
import { Player } from "../../player/player";
import { Board } from "../board";
import { Square } from "../square";
import { Move, MovementMove, CaptureMove, CancelMove, MoveTag } from "./move";
import { GameEngine } from "@/app/diychess/engine/gameEngine";
import { EngineAware } from "@/app/diychess/engine/engineAware";
import { PieceMaterialGroup } from "@/app/diychess/engine/materialManager";

const LIFT_HEIGHT = 1;
const MESH_SCALE = 0.85;

export abstract class Piece extends EngineAware {

  private mesh: Mesh;
  private ghost: Mesh;
  private highlighedGhost: Mesh;
  private shakeAnimation: Animation;
  private liftAnimation: Animation;
  private placeAnimation: Animation;
  private pickupSound: Sound;
  protected board: Board;
  public availableMoves: Map<string, { move: Move, instance: InstancedMesh | undefined }> = new Map();
  private hightlightedMove?: Vector2;
  public currentSquare: Square;
  protected gameManager: GameManager;
  public placed: Boolean;
  public owner: Player;

  abstract createMesh(): Mesh;
  abstract getMaterialGroup(): PieceMaterialGroup;

  constructor(owner: Player, board: Board, square: Square, gameManager: GameManager, gameEngine: GameEngine) {
    super(gameEngine);

    this.placed = false;


    this.gameManager = gameManager;
    this.board = board;

    this.owner = owner;

    this.mesh = this.createMesh();
    this.mesh.material = this.getMaterialGroup().base;
    this.gameEngine.environmentManager!.addShadowCaster(this.mesh);

    this.currentSquare = square;
    this.moveToSquare(square);

    this.ghost = this.mesh.clone();
    this.ghost.material = this.getMaterialGroup().ghost;
    this.ghost.setEnabled(false);

    this.highlighedGhost = this.ghost.clone();
    this.highlighedGhost.isPickable = false;
    this.highlighedGhost.setEnabled(false);

    this.shakeAnimation = new Animation("pawn_shake", "rotation.z", GameEngine.FRAMES_PER_SECOND, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_YOYO);
    this.shakeAnimation.setKeys(
      [
        { frame: 0, value: -0.1 }, { frame: 20, value: 0.1 }
      ]
    );
    this.shakeAnimation.setEasingFunction(new CircleEase());

    this.liftAnimation = new Animation("pawn_lift", "position.y", GameEngine.FRAMES_PER_SECOND, Animation.ANIMATIONTYPE_FLOAT);
    this.liftAnimation.setKeys(
      [
        { frame: 0, value: this.board.getPlacementHeight() }, { frame: 50, value: LIFT_HEIGHT }
      ]
    );
    let liftEase = new CircleEase();
    liftEase.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
    this.liftAnimation.setEasingFunction(liftEase);

    this.placeAnimation = new Animation("pawn_lift", "position.y", GameEngine.FRAMES_PER_SECOND, Animation.ANIMATIONTYPE_FLOAT);
    this.placeAnimation.setKeys(
      [
        { frame: 0, value: LIFT_HEIGHT }, { frame: 30, value: this.board.getPlacementHeight() }
      ]
    );
    let placeEase = new BounceEase(3, 5);
    placeEase.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
    this.placeAnimation.setEasingFunction(placeEase);

    this.mesh.actionManager = this.getActionManager();

    this.pickupSound = this.getPickupSound();
  }

  public canBePlayedBy(player: Player) {
    return this.owner.playerSide == player.playerSide;
  }

  protected abstract getPickupSound(): Sound;

  protected getActionManager(): ActionManager {
    return new PieceActionManager(this, this.gameManager, this.gameEngine);
  }

  public abstract calcAvailableMoves(squareMask?: Vector2[], moveTagFilter?: MoveTag[]): void;

  public showAvailableMoves() {
    this.availableMoves.forEach((availableMove, _) => {
      availableMove.instance = this.createGhostInstance(availableMove.move.target.coordinate);
    });
  }

  public createGhostInstance(coordinate: Vector2) {
    let newInstance = this.ghost.createInstance(`${this.mesh.name} move: ${coordinate.x}:${coordinate.y}`);
    newInstance.isPickable = false;
    newInstance.position = this.vector2ToPlacedVector3(this.board.getTilePosition(coordinate));
    return newInstance;
  }

  public hideAvailableMoves() {
    this.unhighlightAvailableMove();
    this.availableMoves.forEach((move, coordinate) => {
      move.instance?.dispose();
      move.instance = undefined;
    });
  }

  public highlightSquare(square: Square) {
    if (this.availableMoves.has(square.coordinate.toString())) {
      this.hightlightedMove = square.coordinate;

      let ghostMove = this.availableMoves.get(this.hightlightedMove.toString())
      if (ghostMove != null) {
        ghostMove.instance?.dispose();
        ghostMove.instance = undefined;

        this.highlighedGhost.position = this.vector2ToPlacedVector3(this.board.getTilePosition(square.coordinate));
        this.highlighedGhost.material = this.getHighlightMaterial(ghostMove.move);
        this.highlighedGhost.setEnabled(true);

      }
    }
  }

  private getHighlightMaterial(move: Move) {
    if (move instanceof MovementMove) {
      return this.getMaterialGroup().movementGhostHighlight;
    }
    if (move instanceof CaptureMove) {
      return this.getMaterialGroup().captureGhostHighlight;
    }
    if (move instanceof CancelMove) {
      return this.getMaterialGroup().cancelGhostHighlight;
    }
    return this.getMaterialGroup().ghost;
  }

  public makePickable() {
    this.mesh.isPickable = true;
  }

  public makeUnpickable() {
    this.mesh.isPickable = false;
  }

  public onCapture() {
    this.mesh.dispose();
  }

  public unhighlightAvailableMove() {
    if (this.hightlightedMove != null) {
      this.highlighedGhost.setEnabled(false);

      let ghostMove = this.availableMoves.get(this.hightlightedMove.toString())
      if (ghostMove != null) {
        ghostMove.instance = this.createGhostInstance(ghostMove.move.target.coordinate);
      }
      this.hightlightedMove = undefined;
    }
  }

  private vector2ToPlacedVector3(position: Vector2) {
    return new Vector3(position.x, this.board.getPlacementHeight(), position.y);
  }

  public lift(onLiftAnimationEnd?: () => void) {
    this.mesh.animations.push(this.liftAnimation);
    this.pickupSound.play();
    this.gameEngine.runAnimation(this.mesh, [this.liftAnimation], 0, this.liftAnimation.getHighestFrame(), false, 1, onLiftAnimationEnd);
    this.gameEngine.runAnimation(this.mesh, [this.shakeAnimation], 0, this.shakeAnimation.getHighestFrame(), true);
    // this.scene.beginAnimation(this.pawn, 0, 20, true);
    // this.pawn.animations.push(this.shakeAnimation);
    
    this.placed = false;
  }

  public place(square: Square) {
    if(this.placed) {
      return;
    }

    this.mesh.animations.pop();
    this.gameEngine.stopAnimation(this.mesh);

    this.moveToSquare(square, true);

    let position = this.vector2ToPlacedVector3(this.board.getTilePosition(this.currentSquare.coordinate));

    this.mesh.rotation = Vector3.Zero();

    this.gameEngine.runAnimation(this.mesh, [this.placeAnimation], 0, this.placeAnimation.getHighestFrame(), false);
    
    this.placed = true;
    
    this.board.removeAvailableMoves();

  }

  public moveToSquare(target: Square, translation: Boolean = false) {
    this.currentSquare?.removePawn();

    if (translation) {
      let currentPosition = this.board.getTilePosition(this.currentSquare.coordinate)
      let targetPosition = this.board.getTilePosition(target.coordinate);
      let moveVector2 = targetPosition.subtract(currentPosition);
      let moveVector3 = this.vector2ToPlacedVector3(moveVector2);

      this.mesh.translate(moveVector3, 1, Space.WORLD);
    } else {
      this.mesh.position = this.vector2ToPlacedVector3(this.board.getTilePosition(target.coordinate));
    }

    target.placePawn(this);
    this.currentSquare = target;

  }

  public allAvailableMovesAreCancel() {
    var result = true;
    
    this.availableMoves.forEach(move => {
      if(!(move.move instanceof CancelMove)) {
        result = false;
      }
    })
    return result;
  }
}

class PieceActionManager extends ActionManager {

  constructor(piece: Piece, gameManager: GameManager, gameEngine: GameEngine) {
    super(gameEngine.scene);
    this.registerAction(
      new ExecuteCodeAction({
        trigger: ActionManager.OnPickTrigger,
      },
        (event) => {
          gameManager.board.selectPiece(piece);
          gameManager.board.createAvailableMoves();
        },
        new PredicateCondition(this, () => { return piece.canBePlayedBy(gameManager.getCurrentPlayer()) && gameManager.board.selectedPiece == undefined })
      )
    )
  }
}