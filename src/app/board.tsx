import { StandardMaterial, Color3, Vector2, Mesh, MeshBuilder, Vector3, ActionManager, Sound, ExecuteCodeAction, Scene } from "@babylonjs/core";
import { Pawn } from "./checkers/pawn";

export class Board {

  private whiteMaterial: StandardMaterial;
  private blackMaterial: StandardMaterial;
  private pawn!: Pawn;
  private scene!: Scene;

  constructor(scene: Scene) {
    this.whiteMaterial = new StandardMaterial("White");
    this.whiteMaterial.diffuseColor = Color3.FromHexString("#d4f0d3");

    this.blackMaterial = new StandardMaterial("Black");
    this.blackMaterial.diffuseColor = Color3.FromHexString("#17171d");

    this.setup(scene);
  }

  private createTile(position: Vector2, positionOffset: Vector2, size: Vector2, material: StandardMaterial): Mesh {
    const box = MeshBuilder.CreateBox(`${position.x}:${position.y}`, { height: 0.05, width: size.x, depth: size.y });
    box.material = material;
    position = position.add(positionOffset);
    box.position = new Vector3(position.x + size.x / 2, 0, position.y + size.y / 2);
    return box;
  }

  private createBoard(tiles: Vector2, size: Vector2, tileManager: ActionManager) {
    var material: StandardMaterial;
    var positionOffset = size.scale(-0.5);
    var position = Vector2.Zero();
    var tileSize = size.divide(tiles);
    var tile: Mesh;
    for (let row = 0; row < tiles.x; row++) {
      position.x = 0;
      for (let col = 0; col < tiles.y; col++) {
        if (row % 2 === col % 2) {
          material = this.whiteMaterial;
        } else {
          material = this.blackMaterial;
        }
        tile = this.createTile(position, positionOffset, tileSize, material);
        tile.actionManager = tileManager;
        position.x += tileSize.x;
      }
      position.y += tileSize.y;
    }

    this.pawn = new Pawn(tileSize.length() / 2 , this.scene);
    this.pawn.setActionManager(tileManager);
  }

  setup(scene: Scene) {
    this.scene = scene;

    let tileManager = new ActionManager(this.scene);
    tileManager.registerAction(
      new ExecuteCodeAction({
        trigger: ActionManager.OnPickTrigger,
      },
        (event) => { this.pawn.toggleLift(event.source) }
      )
    )

    this.createBoard(new Vector2(8, 8), new Vector2(8, 8), tileManager);
  }
}
