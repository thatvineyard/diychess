import { StandardMaterial, Color3, Vector2, MeshBuilder, Vector3, TransformNode, Tools, Space } from "@babylonjs/core";
import { Piece } from "./piece/piece";
import { SelectBottomRanks, SelectTopRanks, SelectWhiteSquares, SquareSelectionRule } from "./squareSelectionRule";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { Square } from "./square";
import { GameManager, GameRuleError } from "../gameManager";
import { CaptureMove, MoveTag } from "./piece/move";
import { GameEngine, GameEngineError } from "../../engine/gameEngine";
import { Player, PlayerId } from "../player/player";
import { CheckersPawn } from "./piece/checkersPawn";

type BoardConfiguration = {
  dimensions: Vector2;
  originTileIsBlack: boolean;
  meshSize: Vector3;
  borderSize: number;
}

const PLACE_HEIGHT = 0.1;

export class Board extends TransformNode {

  private pieces: Map<PlayerId, Piece[]> = new Map();
  public selectedPiece?: Piece;
  private gameEngine: GameEngine;
  public originTileIsBlack = true;
  private squares: Map<string, Square> = new Map();

  private gameManager: GameManager;

  public boardConfiguration: BoardConfiguration;

  constructor(name: string, boardConfiguration: BoardConfiguration, gameManager: GameManager, gameEngine: GameEngine) {
    super(name, gameEngine.scene);
    this.gameEngine = gameEngine;

    this.boardConfiguration = boardConfiguration;

    this.gameManager = gameManager;

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
    this.gameManager.setUpNextRound();
  }

  public getPlacementHeight() {
    return PLACE_HEIGHT;
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

  public foreachPawn(callback: (pawn: Piece) => void, player?: Player) {
    if (player == null) {
      this.pieces.forEach((value) => {
        value.forEach(callback);
      })
      return
    }

    this.pieces.get(player.name)?.forEach(callback);
  }

  public capturePawn(square: Square) {
    let pawn = square.getPawn();
    if (pawn == null) {
      console.warn("tried to capture an unoccupied square");
      return;
    }

    let owningPlayer = pawn.owner;
    let playerPawns = this.pieces.get(owningPlayer!.name)!;
    this.pieces.set(owningPlayer!.name, playerPawns.filter((value) => value.currentSquare.coordinate != pawn!.currentSquare.coordinate));

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
        material = this.gameEngine.materialManager!.boardMaterialGroup.whiteSquare;
      } else {
        material = this.gameEngine.materialManager!.boardMaterialGroup.blackSquare;
      }
      this.squares.set(coordinate.toString(), new Square(this.getTileName(coordinate), coordinate.clone(), this.getSquareSize(), this.getPlacementHeight(), material, this, this.gameManager, this.gameEngine.scene!));
    })
  }

  private createPieces(setUpWhiteRules: SquareSelectionRule[], setUpBlackRules: SquareSelectionRule[]) {
    this.pieces = new Map();
    this.pieces.set(this.gameManager.whitePlayer.name, []);
    this.pieces.set(this.gameManager.blackPlayer.name, []);

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
        let piece = new CheckersPawn(this.gameManager.whitePlayer, this, square, this.gameManager, this.gameEngine);
        square.placePawn(piece);
        this.pieces.get(this.gameManager.whitePlayer.name)?.push(piece);
        return;
      }

      if (setUpBlack) {
        let piece = new CheckersPawn(this.gameManager.blackPlayer, this, square, this.gameManager, this.gameEngine);
        square.placePawn(piece);
        this.pieces.get(this.gameManager.blackPlayer.name)?.push(piece);
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
    let boardText = MeshBuilder.CreatePlane("boardText", { width: boardBoxMeshSize.x, height: boardBoxMeshSize.y }, this.gameEngine.scene);
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
    let boardMat = new StandardMaterial("boardMat", this.gameEngine.scene);
    boardMat.diffuseColor = Color3.FromHexString("#522b22");
    const boardBoxMeshSize = this.boardConfiguration.meshSize
    let boardBox = MeshBuilder.CreateBox("board", { width: boardBoxMeshSize.x, depth: boardBoxMeshSize.y, height: boardBoxMeshSize.z }, this.gameEngine.scene);
    boardBox.parent = this;
    boardBox.position = Vector3.Up().scale(-0.5 / 2);
    boardBox.material = boardMat;

    boardBox.receiveShadows = true;
    this.gameEngine.environmentManager!.addShadowCaster(boardBox);

    this.createLabels();

    this.createSquares();

    var selectWhiteSquares = new SelectWhiteSquares(this);
    var selectTopRanksRule = new SelectTopRanks(this, 2);
    var selectBottomRanksRule = new SelectBottomRanks(this, 2);

    this.createPieces([selectBottomRanksRule, selectWhiteSquares], [selectTopRanksRule, selectWhiteSquares]);
  }

  public selectPiece(piece: Piece) {
    this.selectedPiece = piece;
    this.selectedPiece.lift();
  }

  public createAvailableMoves(squareMask?: Vector2[], moveTagFilter?: MoveTag[]) {
    if (!this.selectedPiece) {
      throw new GameEngineError("No piece selected")
    }

    this.selectedPiece.calcAvailableMoves(squareMask, moveTagFilter);
    this.selectedPiece?.availableMoves.forEach(({ move, instance }) => {
      if (move instanceof CaptureMove) {
        move.target.getPawn()?.makeUnpickable();
      }
    })
    this.selectedPiece.showAvailableMoves();
  }

  public removeAvailableMoves() {
    this.selectedPiece?.hideAvailableMoves();
    this.selectedPiece?.availableMoves.forEach(({ move, instance }) => {
      if (move instanceof CaptureMove) {
        move.target.getPawn()?.makePickable();
      }
    })
  }

  public allAvailableMovesAreCancel() {
    let result = this.selectedPiece?.allAvailableMovesAreCancel();
    return result;
  }

  public hasAvailableMoves() {
    return this.selectedPiece?.availableMoves.size ?? 0 > 0;
  }

  public deselectPiece() {
    this.selectedPiece?.place(this.selectedPiece?.currentSquare);
    this.selectedPiece = undefined;
  }
}
