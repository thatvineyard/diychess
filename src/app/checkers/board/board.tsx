import { StandardMaterial, Color3, Vector2, Mesh, MeshBuilder, Vector3, ActionManager, Sound, ExecuteCodeAction, Scene, Nullable, Condition, PredicateCondition, TransformNode, Axis, Tools, Space } from "@babylonjs/core";
import { Pawn } from "./pawn/pawn";
import { GameRuleError } from "../game";
import { SelectBottomRanks, SelectTopRanks, SelectWhiteSquares, SquareSelectionRule } from "./squareSelectionRule";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { textSpanContainsTextSpan } from "typescript";
import { Square } from "./square";

type BoardConfiguration = {
  dimensions: Vector2;
  originTileIsBlack: boolean;
  meshSize: Vector3;
  borderSize: number;
}

export class Board extends TransformNode {

  public whiteSquareMaterial: StandardMaterial;
  public whitePawnMaterial: StandardMaterial;
  public whitePawnGhostMaterial: StandardMaterial;
  public blackSquareMaterial: StandardMaterial;
  public blackPawnMaterial: StandardMaterial;
  public blackPawnGhostMaterial: StandardMaterial;
  public moveGhostHighlightMaterial: StandardMaterial;
  public resetGhostHighlightMaterial: StandardMaterial;
  public attackGhostHighlightMaterial: StandardMaterial;
  public selectedPawn?: Pawn;
  private scene!: Scene;
  public originTileIsBlack = true;
  private squares: Map<string, Square> = new Map();

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
    this.whitePawnGhostMaterial = this.whitePawnMaterial.clone("WhiteGhost");
    this.whitePawnGhostMaterial.alpha = 0.2;

    this.blackPawnMaterial = new StandardMaterial("Black");
    this.blackPawnMaterial.diffuseColor = Color3.FromHexString("#503b3b");
    this.blackPawnGhostMaterial = this.blackPawnMaterial.clone("BlackGhost");
    this.blackPawnGhostMaterial.alpha = 0.2;
    
    this.moveGhostHighlightMaterial = new StandardMaterial("moveGhostHighlight")
    this.moveGhostHighlightMaterial.emissiveColor = Color3.FromHexString("#00ff00");
    this.moveGhostHighlightMaterial.alpha = 0.4;
    
    this.resetGhostHighlightMaterial = new StandardMaterial("resetGhostHighlight")
    this.resetGhostHighlightMaterial.emissiveColor = Color3.FromHexString("#0000ff");
    this.resetGhostHighlightMaterial.alpha = 0.4;
    
    this.attackGhostHighlightMaterial = new StandardMaterial("attackGhostHighlight")
    this.attackGhostHighlightMaterial.emissiveColor = Color3.FromHexString("#ff0000");
    this.attackGhostHighlightMaterial.alpha = 0.4;

    this.boardConfiguration = {
      dimensions: new Vector2(10, 10),
      originTileIsBlack: true,
      meshSize: new Vector3(10, 10, 0.5),
      borderSize: 1,
    }

    this.setup();
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

  public foreachSquare(callback: (square: Square) => void) {
    var position = Vector2.Zero();
    for (position.x = 0; position.x < this.boardConfiguration.dimensions.x; position.x++) {
      // position.x = 0;
      for (position.y = 0; position.y < this.boardConfiguration.dimensions.y; position.y++) {
        let square = this.getSquare(position);
        if(square != null) {
          callback(square);
        }
      }
    }
  }

  public foreachCoordinate(callback: (position: Vector2) => void) {
    var position = Vector2.Zero();
    for (position.x = 0; position.x < this.boardConfiguration.dimensions.x; position.x++) {
      // position.x = 0;
      for (position.y = 0; position.y < this.boardConfiguration.dimensions.y; position.y++) {
        callback(position);
      }
    }
  }

  public getSquare(coordinate: Vector2) {
    return this.squares.get(coordinate.toString());
  }

  private createSquares() {
    this.squares = new Map();

    var material: StandardMaterial;
    var position = Vector2.Zero();
    var tileSize = this.getTileSize();
    this.foreachCoordinate((coordinate) => {
      if (coordinate.x % 2 === coordinate.y % 2) {
        material = this.whiteSquareMaterial;
      } else {
        material = this.blackSquareMaterial;
      }
      this.squares.set(coordinate.toString(), new Square(this.getTileName(coordinate), coordinate.clone(), tileSize, material, this, this.scene));
    })
  }

  private createPawns(placeWhiteRules: SquareSelectionRule[], placeBlackRules: SquareSelectionRule[]) {
    this.foreachSquare((square: Square) => {

      const placeWhite = (placeWhiteRules.length !== 0) && placeWhiteRules.reduce((previousValue: boolean,
        selectionRule: SquareSelectionRule) => { return previousValue && selectionRule.select(square.coordinate) },
        true);
        const placeBlack = (placeBlackRules.length !== 0) && placeBlackRules.reduce((previousValue: boolean,
          selectionRule: SquareSelectionRule) => { return previousValue && selectionRule.select(square.coordinate) },
          true);
          if (placeWhite && placeBlack) {
            throw new GameRuleError("Trying to place white and black on same square");
            return;
          }
          
          if (placeWhite) {
            let pawn = new Pawn(true, this, square, this.scene);
            pawn.onLift = () => { this.selectPawn(pawn); };
            square.placePawn(pawn);
            return;
          }
          
          if (placeBlack) {
            let pawn = new Pawn(false, this, square, this.scene);
            pawn.onLift = () => { this.selectPawn(pawn) };
            square.placePawn(pawn);
            return;
          }
      })
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

  public selectPawn(pawn: Pawn) {
    this.selectedPawn = pawn;
    this.selectedPawn.calcAvailableMoves();
    this.selectedPawn.showAvailableMoves();
  }

  public deselectPawn() {
    this.selectedPawn?.hideAvailableMoves();
    this.selectedPawn = undefined;
  }
}
