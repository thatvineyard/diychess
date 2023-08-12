import { ActionManager, ExecuteCodeAction, Mesh, MeshBuilder, Nullable, PredicateCondition, Scene, StandardMaterial, TransformNode, Vector2, Vector3 } from "@babylonjs/core";
import { Board } from "./board";
import { CheckersPawn } from "./piece/checkersPawn";
import { GameManager } from "../gameManager";
import { shadowMapVertexDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/shadowMapVertexDeclaration";
import { Piece } from "./piece/piece";
import { CaptureMove } from "./piece/move";


export class Square extends TransformNode {

  private mesh: Mesh;
  public coordinate: Vector2;
  private board: Board;
  private scene: Scene;
  private pawn?: Piece;
  private gameManager: GameManager;

  constructor(name: string, coordinate: Vector2, size: Vector2, material: StandardMaterial, board: Board, gameManager: GameManager, scene: Scene) {
    super(name, scene);
    this.scene = scene;

    this.parent = board;
    this.board = board;
    this.gameManager = gameManager;

    this.coordinate = coordinate;

    let position = this.board.getTilePosition(coordinate);

    this.mesh = this.createTile(name, position, size, material, this.scene);
    this.mesh.parent = this;
    this.mesh.actionManager = new SquareActionManager(this.board, this.gameManager, this.scene);
  }

  private createTile(name: string, position: Vector2, size: Vector2, material: StandardMaterial, scene: Scene): Mesh {
    const mesh = MeshBuilder.CreateBox(name, { height: 0.05, width: size.x, depth: size.y }, scene);
    mesh.material = material;
    mesh.position = new Vector3(position.x, 0, position.y);
    mesh.parent = this;
    return mesh;
  }

  public placePawn(pawn: Piece) {
    this.pawn = pawn;
  }
  
  public removePawn() {
    this.pawn = undefined;
  }

  public hasPawn() {
    return this.pawn != undefined;
  }
  
  public getPawn() {
    return this.pawn;
  }

}

class SquareActionManager extends ActionManager {

  constructor(board: Board, gameManager: GameManager, scene?: Nullable<Scene> | undefined) {
    super(scene);
    this.registerAction(
      new ExecuteCodeAction({
        trigger: ActionManager.OnPickTrigger,
      },
        (event) => {
          let source = event.source
          if (source instanceof Mesh && source.parent instanceof Square) {
            let move = board.selectedPiece?.availableMoves.get(source.parent.coordinate.toString());
            if (move != null) {
              if(move.move instanceof CaptureMove) {
                board.capturePawn(source.parent);
              }
              board.selectedPiece?.place(source.parent);
              gameManager.nextTurn();
            }
          }
        },
        new PredicateCondition(this, () => { return board.selectedPiece != undefined })
      )
    )
    this.registerAction(
      new ExecuteCodeAction({
        trigger: ActionManager.OnPointerOverTrigger,
      },
        (event) => {
          let source = event.source
          if (source instanceof Mesh && source.parent instanceof Square) {
            board.selectedPiece?.highlightSquare(source.parent);
          }
        },
        new PredicateCondition(this, () => { return board.selectedPiece != undefined })
      )
    )
    this.registerAction(
      new ExecuteCodeAction({
        trigger: ActionManager.OnPointerOutTrigger,
      },
        (event) => {
          let source = event.source
          if (source instanceof Mesh && source.parent instanceof Square) {
            board.selectedPiece?.unhighlightAvailableMove();
          }
        },
        new PredicateCondition(this, () => { return board.selectedPiece != undefined })
      )
    )
  }
}
