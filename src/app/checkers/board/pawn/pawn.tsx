import { Action, ActionManager, Animation, BounceEase, CircleEase, EasingFunction, ExecuteCodeAction, Material, Nullable, PredicateCondition, Scene, Sound, Space, Vector2, Vector3 } from "@babylonjs/core";
import { InstancedMesh, Mesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { FRAMES_PER_SECOND } from "../../engine/engine";
import { Board } from "../board";

const LIFT_HEIGHT = 2;
const PLACED_HEIGHT = 0.05;
const MESH_SCALE = 0.85;
enum State { NOT_DEFINED, LIFTED, PLACED }

export class Pawn {

  private mesh: Mesh;
  private ghost: Mesh;
  private highlighedGhost: Mesh;
  public coordinate: Vector2;
  private state: State;
  private shakeAnimation: Animation;
  private liftAnimation: Animation;
  private placeAnimation: Animation;
  private pickupSound: Sound;
  private scene: Scene;
  private board: Board;
  public availableMoves: Map<string, { coordinate: Vector2, instance: InstancedMesh | undefined }> = new Map<string, { coordinate: Vector2, instance: InstancedMesh | undefined }>();
  private hightlightedMove?: Vector2;
  private isWhite: boolean;

  public calcAvailableMoves() {
    this.availableMoves = new Map<string, { coordinate: Vector2, instance: InstancedMesh | undefined }>();
    let distance = 1;
    this.board.foreachSquare((position) => {
      let difference = position.subtract(this.coordinate);
      if (Math.abs(difference.x) <= distance && Math.abs(difference.y) <= distance) {
        this.availableMoves.set(position.toString(), { coordinate: position.clone(), instance: undefined });
      }
    });
    this.availableMoves.set(this.coordinate.toString(), { coordinate: this.coordinate, instance: undefined });
  }

  public showAvailableMoves() {
    this.availableMoves.forEach((move, _) => {
      move.instance = this.createGhostInstance(move.coordinate);
    });
  }

  public createGhostInstance(coordinate: Vector2) {
    let newInstance = this.ghost.createInstance(`${this.mesh.name} move: ${coordinate.x}:${coordinate.y}`);
    newInstance.isPickable = false;
    newInstance.position = this.toPlacedPosition(this.board.getTilePosition(coordinate));
    return newInstance;
  }

  public hideAvailableMoves() {
    this.unhighlightAvailableMove();
    this.availableMoves.forEach((move, coordinate) => {
      move.instance?.dispose();
      move.instance = undefined;
    });
  }

  public highlightSquare(coordinate: Vector2) {
    if (this.availableMoves.has(coordinate.toString())) {
      this.hightlightedMove = coordinate;

      let ghostMove = this.availableMoves.get(this.hightlightedMove.toString())
      if (ghostMove != null) {
        ghostMove.instance?.dispose();
        ghostMove.instance = undefined;
      }

      this.highlighedGhost.position = this.toPlacedPosition(this.board.getTilePosition(coordinate));
      this.highlighedGhost.setEnabled(true);
    }
  }

  public unhighlightAvailableMove() {
    if (this.hightlightedMove != null) {
      this.highlighedGhost.setEnabled(false);

      let ghostMove = this.availableMoves.get(this.hightlightedMove.toString())
      if (ghostMove != null) {
        ghostMove.instance = this.createGhostInstance(ghostMove.coordinate);
      }
      this.hightlightedMove = undefined;
    }
  }

  constructor(isWhite: boolean, board: Board, coordinate: Vector2, scene: Scene) {
    this.scene = scene;

    this.coordinate = coordinate;

    this.board = board;
    const diameter = Math.min(this.board.getTileSize().y, this.board.getTileSize().x) * MESH_SCALE;

    this.isWhite = isWhite;

    const position = this.board.getTilePosition(this.coordinate);

    this.mesh = MeshBuilder.CreateCylinder('pawn', { height: 0.1, diameter }, this.scene);
    this.mesh.position = new Vector3(position.x, PLACED_HEIGHT, position.y);
    this.mesh.parent = board;
    this.mesh.material = this.isWhite ? this.board.whitePawnMaterial : this.board.blackPawnMaterial;

    this.ghost = this.mesh.clone();
    this.ghost.material = this.isWhite ? this.board.whitePawnGhostMaterial : this.board.blackPawnGhostMaterial;
    this.ghost.setEnabled(false);

    this.highlighedGhost = this.ghost.clone();
    this.highlighedGhost.material = this.isWhite ? this.board.whitePawnGhostHighlightMaterial : this.board.blackPawnGhostHighlightMaterial;
    this.highlighedGhost.isPickable = false;
    this.highlighedGhost.setEnabled(false);

    this.shakeAnimation = new Animation("pawn_shake", "rotation.z", FRAMES_PER_SECOND, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_YOYO);
    this.shakeAnimation.setKeys(
      [
        { frame: 0, value: -0.1 }, { frame: 20, value: 0.1 }
      ]
    );
    this.shakeAnimation.setEasingFunction(new CircleEase());

    this.liftAnimation = new Animation("pawn_lift", "position.y", FRAMES_PER_SECOND, Animation.ANIMATIONTYPE_FLOAT);
    this.liftAnimation.setKeys(
      [
        { frame: 0, value: PLACED_HEIGHT }, { frame: 50, value: LIFT_HEIGHT }
      ]
    );
    let liftEase = new CircleEase();
    liftEase.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
    this.liftAnimation.setEasingFunction(liftEase);

    this.placeAnimation = new Animation("pawn_lift", "position.y", FRAMES_PER_SECOND, Animation.ANIMATIONTYPE_FLOAT);
    this.placeAnimation.setKeys(
      [
        { frame: 0, value: LIFT_HEIGHT }, { frame: 30, value: PLACED_HEIGHT }
      ]
    );
    let placeEase = new BounceEase(3, 5);
    placeEase.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
    this.placeAnimation.setEasingFunction(placeEase);

    this.mesh.actionManager = new PawnActionManager(this, this.board, scene);

    this.state = State.PLACED;

    this.pickupSound = new Sound("POP", "./sfx/comedy_bubble_pop_003.mp3", this.scene, null, { loop: false, autoplay: false });
  }

  private toPlacedPosition(position: Vector2) {
    return new Vector3(position.x, PLACED_HEIGHT, position.y);
  }

  public onLift() { }

  public lift() {
    this.onLift();
    this.mesh.animations.push(this.liftAnimation);
    this.pickupSound.play();
    this.scene.beginDirectAnimation(this.mesh, [this.liftAnimation], 0, this.liftAnimation.getHighestFrame(), false);
    this.scene.beginDirectAnimation(this.mesh, [this.shakeAnimation], 0, this.shakeAnimation.getHighestFrame(), true);
    // this.scene.beginAnimation(this.pawn, 0, 20, true);
    // this.pawn.animations.push(this.shakeAnimation);
    this.state = State.LIFTED;
  }

  public place(coordinate: Vector2) {
    this.mesh.animations.pop();
    this.scene.stopAnimation(this.mesh);

    this.coordinate = coordinate;

    let position = this.toPlacedPosition(this.board.getTilePosition(this.coordinate));

    this.mesh.rotation = Vector3.Zero();
    let moveVector = position.subtract(this.mesh.position);
    moveVector.y = 0;
    this.mesh.position = this.mesh.position.add(moveVector);
    this.scene.beginDirectAnimation(this.mesh, [this.placeAnimation], 0, this.placeAnimation.getHighestFrame(), false);
    this.state = State.PLACED;
  }

}


class PawnActionManager extends ActionManager {

  constructor(pawn: Pawn, board: Board, scene?: Nullable<Scene> | undefined) {
    super(scene);
    this.registerAction(
      new ExecuteCodeAction({
        trigger: ActionManager.OnPickTrigger,
      },
        (event) => {
          pawn.lift();
        },
        new PredicateCondition(this, () => { return board.selectedPawn == undefined })
      )
    )
  }
}