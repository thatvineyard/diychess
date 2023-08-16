import { Color3, HemisphericLight, Mesh, MeshBuilder, Orientation, PointLight, ShadowGenerator, SpotLight, StandardMaterial, Vector3, VertexBuffer, VertexData } from "@babylonjs/core";
import { GameEngine } from "../engine/gameEngine";

export class EnvironmentManager {
  private gameEngine: GameEngine;

  private shadowGenerator: ShadowGenerator;

  constructor(gameEnginge: GameEngine) {
    this.gameEngine = gameEnginge;

    const ambientLight = new HemisphericLight("light", new Vector3(0, 10, 0), this.gameEngine.scene!);
    ambientLight.intensity = 0.4;

    const light = new SpotLight("light", new Vector3(0, 10, 0), new Vector3(0, -10, 0), 10,  1, this.gameEngine.scene!);
    light.intensity = 0.4;

    const background = MeshBuilder.CreateBox("background", {width: 100, height: 70, depth: 100, updatable: true, sideOrientation: Mesh.BACKSIDE});
    background.translate(Vector3.Up(), 10);

    var material = new StandardMaterial("background", gameEnginge.scene);
    material.diffuseColor = Color3.FromHexString("#45392b")

    material.roughness = 100;

    background.material = material;
    background.receiveShadows = true;

    this.shadowGenerator = new ShadowGenerator(1024*4, light);
    this.shadowGenerator.usePoissonSampling = true;
    // this.shadowGenerator.useBlurExponentialShadowMap = true;
  }

  public addShadowCaster(mesh: Mesh) {
    this.shadowGenerator.addShadowCaster(mesh);
  }


}