import { StandardMaterial, Color3, Vector2, Mesh, MeshBuilder, Vector3, ActionManager, Sound, ExecuteCodeAction, Scene, Nullable, Condition, PredicateCondition, TransformNode, Axis, Tools, Space } from "@babylonjs/core";
import { Pawn } from "./pawn/pawn";
import { GameRuleError } from "../game";
import { SelectBottomRanks, SelectTopRanks, SelectWhiteSquares, SquareSelectionRule } from "./squareSelectionRule";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { textSpanContainsTextSpan } from "typescript";
import { Square } from "./square";
import { GameManager } from "../gameManager";
import { Player, PlayerId } from "../player";
import { materialManager as MaterialManager } from "../engine/materialManager";
import { MoveType } from "./pawn/move";

type BoardConfiguration = {
  dimensions: Vector2;
  originTileIsBlack: boolean;
  meshSize: Vector3;
  borderSize: number;
}

export class Board extends TransformNode {

  public materialManager: MaterialManager;
  private pawns: Map<PlayerId, Pawn[]> = new Map();
  public selectedPawn?: Pawn;
  private scene!: Scene;
  public originTileIsBlack = true;
  private squares: Map<string, Square> = new Map();

  private gameManager: GameManager;

  public boardConfiguration: BoardConfiguration;

  constructor(name: string, boardConfiguration: BoardConfiguration, gameManager: GameManager, scene: Scene) {
    super(name, scene);
    this.scene = scene;

    this.boardConfiguration = boardConfiguration;

    this.gameManager = gameManager;

    this.materialManager = new MaterialManager();

    this.setup();
  }

  public getTilePosition(tile: Vector2) {
    var tileSize = this.getSquareSize();
    var positionOffset = tileSize.multiply(this.boardConfiguration.dimensions).scale(-0.5).add(tileSize.scale(0.5));
    return tile.multiply(tileSize).add(positionOffset);
  }

  public getSquareSize() {
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

  public finalizeTurn() {
    this.gameManager.nextTurn();
  }

  public foreachSquare(callback: (square: Square) => void) {
    var position = Vector2.Zero();
    for (position.x = 0; position.x < this.boardConfiguration.dimensions.x; position.x++) {
      // position.x = 0;
      for (position.y = 0; position.y < this.boardConfiguration.dimensions.y; position.y++) {
        let square = this.getSquare(position);
        if (square != null) {
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

  public foreachPawn(callback: (pawn: Pawn) => void, player?: Player) {
    if(player == null) {
      this.pawns.forEach((value) => {
        value.forEach(callback);
      })
      return
    }
    
    this.pawns.get(player.name)?.forEach(callback);
  }

  public capturePawn(square: Square) {
    let pawn = square.getPawn();
    if(pawn == null) {
      console.warn("tried to capture an unoccupied square");
      return;
    }
    
    let owningPlayer = pawn.getOwningPlayer();
    let playerPawns = this.pawns.get(owningPlayer!.name)!;
    this.pawns.set(owningPlayer!.name, playerPawns.filter((value) => value.coordinate != pawn!.coordinate));

    square.removePawn();

    pawn.onCapture();
  }

  public getSquare(coordinate: Vector2) {
    return this.squares.get(coordinate.toString());
  }

  private createSquares() {
    this.squares = new Map();

    var material: StandardMaterial;
    this.foreachCoordinate((coordinate) => {
      if (coordinate.x % 2 === coordinate.y % 2) {
        material = this.materialManager.boardMaterialGroup.whiteSquare;
      } else {
        material = this.materialManager.boardMaterialGroup.blackSquare;
      }
      this.squares.set(coordinate.toString(), new Square(this.getTileName(coordinate), coordinate.clone(), this.getSquareSize(), material, this, this.gameManager, this.scene));
    })
  }

  private createPawns(setUpWhiteRules: SquareSelectionRule[], setUpBlackRules: SquareSelectionRule[]) {
    this.pawns = new Map();
    this.pawns.set(this.gameManager.whitePlayer.name, []);
    this.pawns.set(this.gameManager.blackPlayer.name, []);

    this.foreachSquare((square: Square) => {

      const setUpWhite = (setUpWhiteRules.length !== 0) && setUpWhiteRules.reduce((previousValue: boolean,
        selectionRule: SquareSelectionRule) => { return previousValue && selectionRule.select(square.coordinate) },
        true);
      const setUpBlack = (setUpBlackRules.length !== 0) && setUpBlackRules.reduce((previousValue: boolean,
        selectionRule: SquareSelectionRule) => { return previousValue && selectionRule.select(square.coordinate) },
        true);

      if (setUpWhite && setUpBlack) {
        throw new GameRuleError("Trying to place white and black on same square");
        return;
      }

      if (setUpWhite) {
        let pawn = new Pawn(true, this, square, this.gameManager, this.scene);
        pawn.onLift = () => { this.selectPawn(pawn); };
        square.placePawn(pawn);
        this.pawns.get(this.gameManager.whitePlayer.name)?.push(pawn);
        return;
      }

      if (setUpBlack) {
        let pawn = new Pawn(false, this, square, this.gameManager, this.scene);
        pawn.onLift = () => { this.selectPawn(pawn) };
        square.placePawn(pawn);
        this.pawns.get(this.gameManager.blackPlayer.name)?.push(pawn);
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
    var selectTopRanksRule = new SelectTopRanks(this, 2);
    var selectBottomRanksRule = new SelectBottomRanks(this, 2);

    this.createPawns([selectBottomRanksRule, selectWhiteSquares], [selectTopRanksRule, selectWhiteSquares]);
  }

  public selectPawn(pawn: Pawn) {
    this.selectedPawn = pawn;
    this.selectedPawn.calcAvailableMoves();
    this.selectedPawn?.availableMoves.forEach(({move, instance}) => {
      if(move.moveType == MoveType.ATTACK) {
        move.square.getPawn()?.makeUnpickable();
      }
    })
    this.selectedPawn.showAvailableMoves();
  }

  public deselectPawn() {
    this.selectedPawn?.hideAvailableMoves();
    this.selectedPawn?.availableMoves.forEach(({move, instance}) => {
      if(move.moveType == MoveType.ATTACK) {
        move.square.getPawn()?.makePickable();
      }
    })
    this.selectedPawn = undefined;
  }
}
