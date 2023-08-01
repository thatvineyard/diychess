import { ActionManager, ExecuteCodeAction, Mesh, MeshBuilder, Nullable, PredicateCondition, Scene, StandardMaterial, TransformNode, Vector2, Vector3 } from "@babylonjs/core";
import { Board } from "./board";


export class Square extends TransformNode {

  private mesh: Mesh;
  public coordinate: Vector2;
  private board: Board;
  private scene: Scene;

  constructor(name: string, coordinate: Vector2, size: Vector2, material: StandardMaterial, board: Board, scene: Scene) {
    super(name, scene);
    this.scene = scene;

    this.board = board;

    this.coordinate = coordinate;

    let position = this.board.getTilePosition(coordinate);

    this.mesh = this.createTile(name, position, size, material, this.scene);
    this.mesh.parent = this;
    this.mesh.actionManager = new SquareActionManager(this.board, this.scene);
  }

  private createTile(name: string, position: Vector2, size: Vector2, material: StandardMaterial, scene: Scene): Mesh {
    const mesh = MeshBuilder.CreateBox(name, { height: 0.05, width: size.x, depth: size.y }, scene);
    mesh.material = material;
    mesh.position = new Vector3(position.x, 0, position.y);
    mesh.parent = this;
    return mesh;
  }

}

class SquareActionManager extends ActionManager {

  constructor(board: Board, scene?: Nullable<Scene> | undefined) {
    super(scene);
    this.registerAction(
      new ExecuteCodeAction({
        trigger: ActionManager.OnPickTrigger,
      },
        (event) => {
          let source = event.source
          if (source instanceof Mesh && source.parent instanceof Square) {
            if (board.selectedPawn?.availableMoves.has(source.parent.coordinate.toString())) {
              board.selectedPawn?.place(source.parent.coordinate);
              board.deselectPawn();
            }
          }
        },
        new PredicateCondition(this, () => { return board.selectedPawn != undefined })
      )
    )
    this.registerAction(
      new ExecuteCodeAction({
        trigger: ActionManager.OnPointerOverTrigger,
      },
        (event) => {
          let source = event.source
          if (source instanceof Mesh && source.parent instanceof Square) {
            board.selectedPawn?.highlightSquare(source.parent.coordinate);
          }
        },
        new PredicateCondition(this, () => { return board.selectedPawn != undefined })
      )
    )
    this.registerAction(
      new ExecuteCodeAction({
        trigger: ActionManager.OnPointerOutTrigger,
      },
        (event) => {
          let source = event.source
          if (source instanceof Mesh && source.parent instanceof Square) {
            board.selectedPawn?.unhighlightAvailableMove();
          }
        },
        new PredicateCondition(this, () => { return board.selectedPawn != undefined })
      )
    )
  }
}
