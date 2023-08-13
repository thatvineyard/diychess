import { ArcRotateCamera, Camera, Nullable, Scene, Tools, Vector3, Animation, EasingFunction, CubicEase } from "@babylonjs/core";
import { animateCamera } from "./cameraAnimation";

const DEFAULT_CAMERA_NAME = "camera_main";

const DEFAULT_CAMERA_ALPHA = Tools.ToRadians(-90);
const DEFAULT_CAMERA_BETA = Tools.ToRadians(45);
const DEFAULT_CAMERA_RADIUS = 25;
const DEFAULT_CAMERA_TARGET = Vector3.Zero();

export function createCamera(scene: Scene) {
  const camera = new ArcRotateCamera(DEFAULT_CAMERA_NAME, DEFAULT_CAMERA_ALPHA, DEFAULT_CAMERA_BETA, DEFAULT_CAMERA_RADIUS, DEFAULT_CAMERA_TARGET, scene);

  camera.wheelDeltaPercentage = 0.01;
  camera.zoomToMouseLocation = true;

  camera.fov = 0.4;

  // This attaches the camera to the canvas
  const canvas = scene.getEngine().getRenderingCanvas();
  camera.attachControl(canvas, true);
}

export function getCamera(scene: Scene): ArcRotateCamera {
  var camera = scene.getCameraByName(DEFAULT_CAMERA_NAME);
  if (camera instanceof ArcRotateCamera) {
    return camera;
  } else {
    throw ReferenceError("Camera not found");
  }
}

export function debugLogCamera(scene: Scene) {
  var camera = getCamera(scene);
  console.debug({ target: camera.getTarget().toString(), position: camera.position.toString() });
}

export function resetCamera(
  scene: Scene,
  instant: boolean = false,
) {
  debugLogCamera(scene);
  const camera = getCamera(scene);

  animateCamera(scene, camera, {
    toAlpha: DEFAULT_CAMERA_ALPHA,
    toBeta: DEFAULT_CAMERA_BETA,
    toRadius: DEFAULT_CAMERA_RADIUS,
    toTarget: DEFAULT_CAMERA_TARGET,
    toPosition: getDefaultCameraPosition(scene) || undefined,
    instant,
  });
}

function getDefaultCameraPosition(scene: Scene): Vector3 {
  const worldExtends = scene.getWorldExtends(
    (mesh) => mesh.isVisible && mesh.isEnabled()
  );
  const worldSize = worldExtends.max.subtract(worldExtends.min);
  const worldCenter = worldExtends.min.add(worldSize.scale(0.5));

  return new Vector3(worldCenter.x, worldCenter.y, -DEFAULT_CAMERA_RADIUS);
}