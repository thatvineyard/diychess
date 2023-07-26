'use client'

import React from "react";
import { Vector3, HemisphericLight, MeshBuilder, Scene, EngineOptions, SceneOptions, StandardMaterial, Color3, Mesh, Tools, Vector2, Material } from "@babylonjs/core";
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
  let boardMat = new StandardMaterial("boardMat", scene);
  boardMat.diffuseColor = Color3.FromHexString("#522b22");
  let ground = MeshBuilder.CreateBox("board", { width: 10, depth: 10, height: 0.5 }, scene);
  ground.position = Vector3.Up().scale(-0.5/2);
  ground.material = boardMat;


  const whiteMaterial = new StandardMaterial("White");
  whiteMaterial.diffuseColor = Color3.FromHexString("#d4f0d3");

  const blackMaterial = new StandardMaterial("Black");
  blackMaterial.diffuseColor = Color3.FromHexString("#17171d");

  function createTile(position: Vector2, positionOffset: Vector2, size: Vector2, material: StandardMaterial) {
    const box = MeshBuilder.CreateBox(`${position.x}:${position.y}`, { height: 0.05, width: size.x, depth: size.y });
    box.material = material;
    position = position.add(positionOffset);
    box.position = new Vector3(position.x + size.x/2, 0, position.y + size.y/2);
  }

  function createBoard(tiles: Vector2, size: Vector2) {
    var material: StandardMaterial;
    var positionOffset = size.scale(-0.5);
    var position = Vector2.Zero();
    var tileSize = size.divide(tiles);
    for (let row = 0; row < tiles.x; row++) {
        position.x = 0;
        for (let col = 0; col < tiles.y; col++) {
            if (row % 2 === col % 2) {
                material = whiteMaterial;
            } else {
                material = blackMaterial;
            }
            createTile(position, positionOffset, tileSize, material);
            position.x += tileSize.x;
        }
        position.y += tileSize.y;
    }
  }
  createBoard(new Vector2(8,8), new Vector2(8,8));
  scene.onPointerDown = function (evt, pickResult) {
    // We try to pick an object
    if (pickResult.hit) {
        var name = pickResult.pickedMesh?.name;
        console.log(`hit ${name}`);
    }
};
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
