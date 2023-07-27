import { Action, ActionManager, Animation, Scene, Sound, Space, Vector3 } from "@babylonjs/core";
import { Mesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { FRAMES_PER_SECOND } from "./engine/engine";

const LIFT_HEIGHT = 2;
enum State { NOT_DEFINED, LIFTED, PLACED }

export class Pawn {

  private pawn: Mesh;
  private state: State;
  private shakeAnimation: Animation;
  private pickupSound: Sound;
  private scene: Scene;

  constructor(diameter: number, scene: Scene) {
    this.scene = scene;

    this.pawn = MeshBuilder.CreateCylinder('pawn', { height: 0.1, diameter }, this.scene);
    this.pawn.position = Vector3.Up().scale(0.05);

    this.shakeAnimation = new Animation("pawn_shake", "rotation.z", FRAMES_PER_SECOND, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_YOYO);
    let shakeKeyFrames = [
      { frame: 0, value: -0.1 }, { frame: 20, value: 0.1 }
    ]
    this.shakeAnimation.setKeys(shakeKeyFrames);

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
    this.pawn.translate(Vector3.Up(), LIFT_HEIGHT);
    this.pawn.animations.push(this.shakeAnimation);
    this.pickupSound.play();
    this.scene.beginAnimation(this.pawn, 0, 20, true);
    this.state = State.LIFTED;
  }

  public place(placement: Mesh) {
    this.pawn.animations.pop();
    this.scene.stopAnimation(this.pawn);
    this.pawn.rotation = Vector3.Zero();
    this.pawn.translate(Vector3.Down(), LIFT_HEIGHT);
    let moveVector = placement.position.subtract(this.pawn.position);
    moveVector.y = 0;
    this.pawn.position = this.pawn.position.add(moveVector);
    this.state = State.PLACED;
  }

}