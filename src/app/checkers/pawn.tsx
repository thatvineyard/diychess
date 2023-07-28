import { Action, ActionManager, Animation, BounceEase, CircleEase, EasingFunction, Scene, Sound, Space, Vector3 } from "@babylonjs/core";
import { Mesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { FRAMES_PER_SECOND } from "./engine/engine";

const LIFT_HEIGHT = 2;
const PLACED_HEIGHT = 0.05;
enum State { NOT_DEFINED, LIFTED, PLACED }

export class Pawn {

  private pawn: Mesh;
  private state: State;
  private shakeAnimation: Animation;
  private liftAnimation: Animation;
  private placeAnimation: Animation;
  private pickupSound: Sound;
  private scene: Scene;

  constructor(diameter: number, scene: Scene) {
    this.scene = scene;

    this.pawn = MeshBuilder.CreateCylinder('pawn', { height: 0.1, diameter }, this.scene);
    this.pawn.position = Vector3.Up().scale(PLACED_HEIGHT);
    this.pawn.parent

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

    this.state = State.NOT_DEFINED;

    this.pickupSound = new Sound("POP", "./sfx/comedy_bubble_pop_003.mp3", this.scene, null, { loop: false, autoplay: false });

    this.lift();
  }

  public setActionManager(actionManager: ActionManager) {
    this.pawn.actionManager = actionManager;
  }

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
    this.pawn.animations.push(this.liftAnimation);
    this.pickupSound.play();
    this.scene.beginDirectAnimation(this.pawn, [this.liftAnimation], 0, this.liftAnimation.getHighestFrame(), false);
    this.scene.beginDirectAnimation(this.pawn, [this.shakeAnimation], 0, this.shakeAnimation.getHighestFrame(), true);
    // this.scene.beginAnimation(this.pawn, 0, 20, true);
    // this.pawn.animations.push(this.shakeAnimation);
    this.state = State.LIFTED;
  }

  public place(placement: Mesh) {
    this.pawn.animations.pop();
    this.scene.stopAnimation(this.pawn);

    this.pawn.rotation = Vector3.Zero();
    let moveVector = placement.position.subtract(this.pawn.position);
    moveVector.y = 0;
    this.pawn.position = this.pawn.position.add(moveVector);
    this.scene.beginDirectAnimation(this.pawn, [this.placeAnimation], 0, this.placeAnimation.getHighestFrame(), false);
    this.state = State.PLACED;
  }

}