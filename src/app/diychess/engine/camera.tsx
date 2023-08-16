import { ArcRotateCamera, Camera, Nullable, Scene, Tools, Vector3, Animation, EasingFunction, CubicEase, LensRenderingPipeline } from "@babylonjs/core";
import { animateCamera } from "./cameraAnimation";
import { GameEngine } from "./gameEngine";

const DEFAULT_CAMERA_NAME = "camera_main";

const DEFAULT_CAMERA_ALPHA = Tools.ToRadians(-90);
const DEFAULT_CAMERA_BETA = Tools.ToRadians(45);
const DEFAULT_CAMERA_RADIUS = 25;
const DEFAULT_CAMERA_TARGET = Vector3.Zero();

export function createCamera(gameEngine: GameEngine) {
  const camera = new ArcRotateCamera(DEFAULT_CAMERA_NAME, DEFAULT_CAMERA_ALPHA, DEFAULT_CAMERA_BETA, DEFAULT_CAMERA_RADIUS, new Vector3(0, gameEngine!.gameManager!.board.getPlacementHeight(), 0), gameEngine.scene);

  camera.wheelDeltaPercentage = 0.01;
  camera.zoomToMouseLocation = true;

  camera.fov = 0.4;

  // This attaches the camera to the canvas
  const canvas = gameEngine.scene!.getEngine().getRenderingCanvas();
  camera.attachControl(canvas, true);

  var lensEffect = new LensRenderingPipeline('lens', {
		edge_blur: 0,
		chromatic_aberration: 1.0,
		distortion: 0.2,
		dof_focus_distance: camera.radius + 10,
		dof_aperture: 0.5,			// set this very high for tilt-shift effect
		grain_amount: 1.0,
		dof_pentagon: true,
		dof_gain: 1.0,
		dof_threshold: 1.0,
		dof_darken: 0.25
	}, gameEngine.scene!, 1.0, [camera]);

  gameEngine.scene!.onAfterRenderCameraObservable.add(camera => {
    if(camera instanceof ArcRotateCamera) {
      if(isArcRotateCameraMoving(camera)) {
        lensEffect.setFocusDistance(camera.radius + 10);
      }
    }
  })
}

const isArcRotateCameraMoving = (camera: ArcRotateCamera) => {
  return camera.inertialAlphaOffset !== 0 
      || camera.inertialBetaOffset !== 0
      || camera.inertialRadiusOffset !== 0
      || camera.inertialPanningX !== 0
      || camera.inertialPanningY !== 0;
};

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