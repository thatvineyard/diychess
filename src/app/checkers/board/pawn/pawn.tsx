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
  private coordinate: Vector2;
  private state: State;
  private shakeAnimation: Animation;
  private liftAnimation: Animation;
  private placeAnimation: Animation;
  private pickupSound: Sound;
  private scene: Scene;
  private board: Board;
  public availableMoves: Vector2[] = [];
  private availableMoveInstances: InstancedMesh[] = [];

  public calcAvailableMoves() {
    this.availableMoves = [];
    let distance = 1;
    this.board.foreachSquare((position) => {
      let difference = position.subtract(this.coordinate);
      if(Math.abs(difference.x) <= distance && Math.abs(difference.y) <= distance) {
        this.availableMoves.push(position.clone());
      }
    });
  }

  public showAvailableMoves() {
    this.availableMoves.forEach(position => {
      let newInstance = this.ghost.createInstance(`${this.mesh.name} move: ${position.x}:${position.y}`);
      newInstance.isPickable = false;
      let meshPosition = this.board.getTilePosition(position);
      newInstance.position = new Vector3(meshPosition.x, PLACED_HEIGHT, meshPosition.y);
      this.availableMoveInstances.push(newInstance);
    });
    let newInstance = this.ghost.createInstance(`${this.mesh.name} move: reset`);
    newInstance.isPickable = false;
    newInstance.position = new Vector3(this.mesh.position.x, PLACED_HEIGHT, this.mesh.position.z);
    this.availableMoveInstances.push(newInstance);
  }

  public hideAvailableMoves() {
    this.availableMoveInstances.forEach(instance => {
      instance.dispose();      
    });
    this.availableMoveInstances = [];
  }

  constructor(isWhite: boolean, board: Board, coordinate: Vector2, scene: Scene) {
    this.scene = scene;

    this.coordinate = coordinate;

    this.board = board;
    const diameter = Math.min(this.board.getTileSize().y, this.board.getTileSize().x) * MESH_SCALE;

    const position = this.board.getTilePosition(this.coordinate);

    this.mesh = MeshBuilder.CreateCylinder('pawn', { height: 0.1, diameter }, this.scene);
    this.mesh.position = new Vector3(position.x, PLACED_HEIGHT, position.y);
    this.mesh.parent = board;
    this.mesh.material = isWhite ? this.board.whitePawnMaterial : this.board.blackPawnMaterial;

    this.ghost = this.mesh.clone();
    this.ghost.material = isWhite ? this.board.whitePawnGhostMaterial : this.board.blackPawnGhostMaterial;
    this.ghost.setEnabled(false);

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

  public onLift() { }

  public toggleLift(placement: Mesh) {
    switch (this.state) {
      case State.NOT_DEFINED:
        break;
      case State.LIFTED:
        this.place(placement);
        break;
      case State.PLACED:
        this.lift();
        break;
    }
  }

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

  public place(placement: Mesh) {
    this.mesh.animations.pop();
    this.scene.stopAnimation(this.mesh);

    this.mesh.rotation = Vector3.Zero();
    let moveVector = placement.position.subtract(this.mesh.position);
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
          pawn.toggleLift(event.source)
        },
        new PredicateCondition(this, () => { return board.selectedPawn == undefined })
      )
    )
  }
}