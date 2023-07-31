import { StandardMaterial, Color3, Vector2, Mesh, MeshBuilder, Vector3, ActionManager, Sound, ExecuteCodeAction, Scene, Nullable, Condition, PredicateCondition, TransformNode, Axis, Tools, Space } from "@babylonjs/core";
import { Pawn } from "./pawn/pawn";
import { GameRuleError } from "../game";
import { SelectBottomRanks, SelectTopRanks, SelectWhiteSquares, SquareSelectionRule } from "./SquareSelectionRule";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { textSpanContainsTextSpan } from "typescript";

type BoardConfiguration = {
  dimensions: Vector2;
  originTileIsBlack: boolean;
  meshSize: Vector3;
  borderSize: number;
}

export class Board extends TransformNode {

  public whiteSquareMaterial: StandardMaterial;
  public whitePawnMaterial: StandardMaterial;
  public blackSquareMaterial: StandardMaterial;
  public blackPawnMaterial: StandardMaterial;
  public selectedPawn?: Pawn;
  private scene!: Scene;
  public originTileIsBlack = true;

  public boardConfiguration: BoardConfiguration;

  constructor(name: string, scene: Scene) {
    super(name, scene);
    this.scene = scene;

    this.whiteSquareMaterial = new StandardMaterial("White");
    this.whiteSquareMaterial.diffuseColor = Color3.FromHexString("#f0e7d3");

    this.blackSquareMaterial = new StandardMaterial("Black");
    this.blackSquareMaterial.diffuseColor = Color3.FromHexString("#17171d");

    this.whitePawnMaterial = new StandardMaterial("White");
    this.whitePawnMaterial.diffuseColor = Color3.FromHexString("#e4b293");

    this.blackPawnMaterial = new StandardMaterial("Black");
    this.blackPawnMaterial.diffuseColor = Color3.FromHexString("#503b3b");

    this.boardConfiguration = {
      dimensions: new Vector2(10, 10),
      originTileIsBlack: true,
      meshSize: new Vector3(10, 10, 0.5),
      borderSize: 1,
    }

    this.setup();
  }

  private createTile(name: string, position: Vector2, size: Vector2, material: StandardMaterial): Mesh {
    const box = MeshBuilder.CreateBox(name, { height: 0.05, width: size.x, depth: size.y });
    box.material = material;
    box.position = new Vector3(position.x, 0, position.y);
    box.parent = this;
    return box;
  }

  public getTilePosition(tile: Vector2) {
    var tileSize = this.getTileSize();
    var positionOffset = tileSize.multiply(this.boardConfiguration.dimensions).scale(-0.5).add(tileSize.scale(0.5));
    return tile.multiply(tileSize).add(positionOffset);
  }

  public getTileSize() {
    const squaresMeshSize = new Vector2(this.boardConfiguration.meshSize.x, this.boardConfiguration.meshSize.y).subtract(Vector2.One().scale(this.boardConfiguration.borderSize * 2));
    return squaresMeshSize.divide(this.boardConfiguration.dimensions);
  }

  private getTileName(tile: Vector2) {
    return `${this.getRankName(tile.y)}${this.getFileName(tile.x)}`;
  }

  private getFileName(file: number) {
    return `${file + 1}`;
  }

  private getRankName(rank: number) {
    return String.fromCharCode('A'.charCodeAt(0) + rank);
  }

  private createSquares() {
    var material: StandardMaterial;
    var position = Vector2.Zero();
    var tileSize = this.getTileSize();
    var tile: Mesh;
    var position = Vector2.Zero();
    for (position.x = 0; position.x < this.boardConfiguration.dimensions.x; position.x++) {
      // position.x = 0;
      for (position.y = 0; position.y < this.boardConfiguration.dimensions.y; position.y++) {
        if (position.x % 2 === position.y % 2) {
          material = this.whiteSquareMaterial;
        } else {
          material = this.blackSquareMaterial;
        }
        tile = this.createTile(this.getTileName(position), this.getTilePosition(position), tileSize, material);
        tile.actionManager = new TileActionManager(this, this.scene);
      }
    }
  }

  private createPawns(placeWhiteRules: SquareSelectionRule[], placeBlackRules: SquareSelectionRule[]) {
    for (let row = 0; row < this.boardConfiguration.dimensions.x; row++) {
      for (let col = 0; col < this.boardConfiguration.dimensions.y; col++) {
        const placeWhite = (placeWhiteRules.length !== 0) && placeWhiteRules.reduce((previousValue: boolean,
          selectionRule: SquareSelectionRule) => { return previousValue && selectionRule.select(new Vector2(row, col)) },
          true);
        const placeBlack = (placeBlackRules.length !== 0) && placeBlackRules.reduce((previousValue: boolean,
          selectionRule: SquareSelectionRule) => { return previousValue && selectionRule.select(new Vector2(row, col)) },
          true);
        if (placeWhite && placeBlack) {
          throw new GameRuleError("Trying to place white and black on same square");
          continue;
        }

        if (placeWhite) {
          let pawn = new Pawn(true, this, new Vector2(row, col), this.scene);
          pawn.onLift = () => { this.selectedPawn = pawn };
          continue;
        }

        if (placeBlack) {
          let pawn = new Pawn(false, this, new Vector2(row, col), this.scene);
          pawn.onLift = () => { this.selectedPawn = pawn };
          continue;
        }
      }
    }
  }

  createLabels() {
    const meshSize = new Vector2(this.boardConfiguration.meshSize.x, this.boardConfiguration.meshSize.y);
    const squaresMeshSize = meshSize.subtract(Vector2.One().scale(this.boardConfiguration.borderSize * 2));

    const borderStartProcent = squaresMeshSize.divide(meshSize).scale(50);
    const borderOffsetProcent = borderStartProcent.add(Vector2.One().scale(50)).scale(0.5);

    const boardBoxMeshSize = this.boardConfiguration.meshSize
    let boardText = MeshBuilder.CreatePlane("boardText", { width: boardBoxMeshSize.x, height: boardBoxMeshSize.y }, this.scene);
    boardText.parent = this;
    boardText.rotate(Vector3.Left(), Tools.ToRadians(-90));
    boardText.translate(Vector3.Up(), 0.01, Space.WORLD);

    let boardTextMat = AdvancedDynamicTexture.CreateForMesh(boardText);

    var position = Vector2.Zero();
    for (position.x = 0; position.x < this.boardConfiguration.dimensions.x; position.x++) {

      const leftOffset = ((this.getTilePosition(position).x / (squaresMeshSize.x)) * (borderStartProcent.x * 2));

      let topFileText = new TextBlock();
      topFileText.text = this.getRankName(position.x);
      // topFileText.text = leftOffset.toString();
      topFileText.color = "#FFFFFF";
      topFileText.fontSize = 24;
      topFileText.top = `${borderOffsetProcent.x}%`;
      topFileText.left = `${leftOffset}%`
      boardTextMat.addControl(topFileText);

      let bottomFileText = new TextBlock();
      bottomFileText.text = this.getRankName(position.x);
      bottomFileText.color = "#FFFFFF";
      bottomFileText.fontSize = 24;
      bottomFileText.top = `${-borderOffsetProcent.x}%`;
      bottomFileText.left = `${leftOffset}%`;
      bottomFileText.rotation = Tools.ToRadians(180);
      boardTextMat.addControl(bottomFileText);
    }

    for (position.y = 0; position.y < this.boardConfiguration.dimensions.y; position.y++) {

      const topOffset = -((this.getTilePosition(position).y / (squaresMeshSize.y)) * (borderStartProcent.y * 2));

      let startRankText = new TextBlock();
      startRankText.text = this.getFileName(position.y);
      startRankText.color = "#FFFFFF";
      startRankText.fontSize = 24;
      startRankText.left = `${-borderOffsetProcent.y}%`;
      startRankText.top = `${topOffset}%`;
      // startRankText.rotation = Tools.ToRadians(-90);
      boardTextMat.addControl(startRankText);

      let endRankText = new TextBlock();
      endRankText.text = this.getFileName(position.y);
      endRankText.color = "#FFFFFF";
      endRankText.fontSize = 24;
      endRankText.left = `${borderOffsetProcent.y}%`;
      endRankText.top = `${topOffset}%`;
      endRankText.rotation = Tools.ToRadians(180);
      boardTextMat.addControl(endRankText);
    }
  }

  setup() {

    let boardMat = new StandardMaterial("boardMat", this.scene);
    boardMat.diffuseColor = Color3.FromHexString("#522b22");
    const boardBoxMeshSize = this.boardConfiguration.meshSize
    let boardBox = MeshBuilder.CreateBox("board", { width: boardBoxMeshSize.x, depth: boardBoxMeshSize.y, height: boardBoxMeshSize.z }, this.scene);
    boardBox.parent = this;
    boardBox.position = Vector3.Up().scale(-0.5 / 2);
    boardBox.material = boardMat;

    this.createLabels();

    this.createSquares();

    var selectWhiteSquares = new SelectWhiteSquares(this);
    var selectTopRanksRule = new SelectTopRanks(this, 3);
    var selectBottomRanksRule = new SelectBottomRanks(this, 3);

    this.createPawns([selectBottomRanksRule, selectWhiteSquares], [selectTopRanksRule, selectWhiteSquares]);
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
