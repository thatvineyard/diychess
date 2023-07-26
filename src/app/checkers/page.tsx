'use client'

import React from "react";
import { Vector3, HemisphericLight, MeshBuilder, Scene, EngineOptions, SceneOptions } from "@babylonjs/core";
import SceneComponent from "./sceneComponent"; 
import "./canvas.css";
import { createCamera, resetCamera } from "./camera";
import { AdvancedDynamicTexture, Button } from "@babylonjs/gui";
import * as guiTexture from "./guiTexture.json";

type Box = {
  position: { y: number, x: number },
  rotation: { y: number }
}

let box: Box;

let frames = 0;

const onSceneReady = (scene: Scene) => {
  createCamera(scene);
  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  // Our built-in 'box' shape.s
  box = MeshBuilder.CreateBox("box", { size: 2 }, scene);
  

  // Move the box upward 1/2 its height
  box.position.y = 1;

  // Our built-in 'ground' shape.
  MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);

  // // GUI
  let advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("GUI", true, scene);
  // let loadedGUI = advancedTexture.parseFromURLAsync("https://doc.babylonjs.com/examples/ColorPickerGui.json");
  let loadedGUI = advancedTexture.parseSerializedObject(guiTexture);
  let buttonResetCam = advancedTexture.getControlByName("button_reset_cam");
  buttonResetCam?.onPointerClickObservable.add(() => resetCamera(scene));
};

/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
const onRender = (scene: Scene) => {
  if (box !== undefined) {
    const deltaTimeInMillis = scene.getEngine().getDeltaTime();

    const rpm = 10;
    box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
  }
  frames++;
};

export default function CheckersPage() {
  var engineOptions: EngineOptions = {}
  var sceneOptions: SceneOptions = {}
  return (
    <SceneComponent antialias onSceneReady={onSceneReady} onRender={onRender} id="my-canvas" engineOptions={engineOptions} adaptToDeviceRatio={false} sceneOptions={sceneOptions} />
  )
}
