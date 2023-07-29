import { StandardMaterial, Color3, Vector2, Mesh, MeshBuilder, Vector3, ActionManager, Sound, ExecuteCodeAction, Scene, Nullable, Condition, PredicateCondition } from "@babylonjs/core";
import { Pawn } from "./pawn/pawn";

export class Board {

  private whiteMaterial: StandardMaterial;
  private blackMaterial: StandardMaterial;
  public selectedPawn?: Pawn;
  private scene!: Scene;
  private dimensions: Vector2 = Vector2.One().scale(8);
  private tileSize: Vector2 = Vector2.One();

  constructor(scene: Scene) {
    this.whiteMaterial = new StandardMaterial("White");
    this.whiteMaterial.diffuseColor = Color3.FromHexString("#d4f0d3");

    this.blackMaterial = new StandardMaterial("Black");
    this.blackMaterial.diffuseColor = Color3.FromHexString("#17171d");

    this.setup(scene);
  }

  private createTile(position: Vector2, size: Vector2, material: StandardMaterial): Mesh {
    const box = MeshBuilder.CreateBox(`${position.x}:${position.y}`, { height: 0.05, width: size.x, depth: size.y });
    box.material = material;
    box.position = new Vector3(position.x, 0, position.y);
    return box;
  }

  private getTilePosition(tile: Vector2) {
    var positionOffset = this.tileSize.multiply(this.dimensions).scale(-0.5).add(this.tileSize.scale(0.5));
    return tile.multiply(this.tileSize).add(positionOffset);
  }

  private createBoard(tiles: Vector2, size: Vector2, scene: Scene) {
    this.dimensions = tiles;
    var material: StandardMaterial;
    var positionOffset = size.scale(-0.5);
    var position = Vector2.Zero();
    this.tileSize = size.divide(this.dimensions);
    var tile: Mesh;
    var pawn: Pawn;
    for (let row = 0; row < this.dimensions.x; row++) {
      // position.x = 0;
      for (let col = 0; col < this.dimensions.y; col++) {
        if (row % 2 === col % 2) {
          material = this.whiteMaterial;
        } else {
          material = this.blackMaterial;
        }
        tile = this.createTile(this.getTilePosition(new Vector2(row, col)), this.tileSize, material);
        tile.actionManager = new TileActionManager(this, scene);
        // position.x += this.tileSize.x;
      }
      // position.y += this.tileSize.y;
    }
  }

  private createPawns(placePredicate: (tile: Vector2)=>boolean, scene: Scene) {
    for (let row = 0; row < this.dimensions.x; row++) {
      for (let col = 0; col < this.dimensions.y; col++) {
        if(placePredicate(new Vector2(row, col))) {
          let pawn = new Pawn(this.tileSize.length() / 2, this.getTilePosition(new Vector2(row, col)), this.scene);
          pawn.onLift = () => { this.selectedPawn = pawn };
        }
      }
    }
  }

  setup(scene: Scene) {
    this.scene = scene;

    this.createBoard(new Vector2(8, 8), new Vector2(8, 8), scene);
    this.createPawns((tile: Vector2) => {
      return (tile.x < 3 && (tile.y - tile.x) % 2 == 0) || (tile.x >= this.dimensions.x - 3 && (tile.y - tile.x) % 2 != 0);
    }, scene);
  }
}


class TileActionManager extends ActionManager {

  constructor(board: Board, scene?: Nullable<Scene> | undefined) {
    super(scene);
    this.registerAction(
      new ExecuteCodeAction({
        trigger: ActionManager.OnPickTrigger,
      },
        (event) => {
          board.selectedPawn?.place(event.source);
          board.selectedPawn = undefined;
        },
        new PredicateCondition(this, () => { return board.selectedPawn != undefined })
      )
    )
  }
}
