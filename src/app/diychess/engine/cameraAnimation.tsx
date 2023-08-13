import { Scene, ArcRotateCamera, Vector3, Animation, CubicEase, EasingFunction, AnimationAssetTask } from "@babylonjs/core";
import { GameEngine } from "./gameEngine";

const SPEED_RATIO = 1.5;
const LOOP_MODE = false;
const FROM_FRAME = 0;
const TO_FRAME = 100;

type AnimationParameters = {
  fromRadius?: number,
  toRadius?: number,
  fromAlpha?: number,
  toAlpha?: number,
  fromBeta?: number,
  toBeta?: number,
  fromTarget?: Vector3,
  toTarget?: Vector3,
  fromPosition?: Vector3,
  toPosition?: Vector3,
  toRotation?: Vector3,
  fromRotation?: Vector3,
  instant: boolean,
}

export function animateCamera(
  scene: Scene,
  camera: ArcRotateCamera,
  {
    fromRadius,
    toRadius,
    fromAlpha,
    toAlpha,
    fromBeta,
    toBeta,
    fromTarget,
    toTarget,
    fromPosition,
    toPosition,
    fromRotation,
    toRotation,
    instant,
  }: AnimationParameters,
  onAnimationEnd?: () => void
) {
  let animations: Animation[] = [];

  if (toPosition) {
    animations = [
      ...animations,
      createCameraAnimation({
        property: "position.x",
        from: fromPosition?.x || camera.position.x,
        to: toPosition.x,
      }),
      createCameraAnimation({
        property: "position.y",
        from: fromPosition?.y || camera.position.y,
        to: toPosition.y,
      }),
      createCameraAnimation({
        property: "position.z",
        from: fromPosition?.z || camera.position.z,
        to: toPosition.z,
      }),
    ];
  }

  if (toTarget) {
    animations = [
      ...animations,
      createCameraAnimation({
        property: "target",
        from: fromTarget || camera.target,
        to: toTarget,
      })
    ];
  }

  if (toRotation) {
    animations = [
      ...animations,
      createCameraAnimation({
        property: "rotation.x",
        from: fromRotation?.x || camera.rotation.x,
        to: toRotation.x,
      }),
      createCameraAnimation({
        property: "rotation.y",
        from: fromRotation?.y || camera.rotation.y,
        to: toRotation.y,
      }),
      createCameraAnimation({
        property: "rotation.z",
        from: fromRotation?.z || camera.rotation.z,
        to: toRotation.z,
      }),
    ];
  }

  if (camera instanceof ArcRotateCamera) {
    if (toRadius) {
      animations = [
        ...animations,
        createCameraAnimation({
          property: "radius",
          from: fromRadius || camera.radius,
          to: toRadius,
        }),
      ];
    }
    if (toBeta) {
      animations = [
        ...animations,
        createCameraAnimation({
          property: "beta",
          from: fromBeta || camera.beta,
          to: toBeta,
        }),
      ];
    }
    if (toAlpha) {
      animations = [
        ...animations,

        createCameraAnimation({
          property: "alpha",
          from: fromAlpha || camera.alpha,
          to: toAlpha,
        }),
      ];
    }
  }

  camera.animations = animations;

  scene.beginAnimation(
    camera,
    FROM_FRAME,
    instant ? FROM_FRAME+1 : TO_FRAME,
    LOOP_MODE,
    SPEED_RATIO,
    onAnimationEnd
  );
}


function createCameraAnimation({
  property,
  from,
  to,
}: { property: string, from: any, to: any }) {
  const ease = new CubicEase();
  ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

  const animation = Animation.CreateAnimation(
    property,
    to instanceof Vector3 ? Animation.ANIMATIONTYPE_VECTOR3 : Animation.ANIMATIONTYPE_FLOAT,
    GameEngine.FRAMES_PER_SECOND,
    ease
  );
  animation.setKeys([
    {
      frame: 0,
      value: from,
    },
    {
      frame: 100,
      value: to,
    },
  ]);

  return animation;
}
