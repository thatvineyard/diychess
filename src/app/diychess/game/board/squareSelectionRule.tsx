import { Vector2 } from "@babylonjs/core";
import { Board } from "./board";
import { Player } from "../player";
import { Square } from "./square";
import { checkSquaresBetweenSquaresOnDiagonals } from "./boardUtils";

export interface SquareSelectionRule {
  select(position: Vector2, center?: Vector2): boolean
}

export class SelectEmptySquare implements SquareSelectionRule {
  private board: Board;

  constructor(board: Board) {
    this.board = board;
  }

  select(position: Vector2): boolean {
    return !this.board.getSquare(position)?.hasPawn() ?? false;
  }
}

export class SelectBlackSquares implements SquareSelectionRule {
  private board: Board;

  constructor(board: Board) {
    this.board = board;
  }

  select(position: Vector2): boolean {
    return (position.x % 2 === position.y % 2) !== this.board.originTileIsBlack;
  }
}

export class SelectWhiteSquares implements SquareSelectionRule {
  private board: Board;

  constructor(board: Board) {
    this.board = board;
  }

  select(position: Vector2): boolean {
    return (position.x % 2 === position.y % 2) === this.board.originTileIsBlack;
  }
}

export class SelectBottomRanks implements SquareSelectionRule {
  private board: Board;
  private numRanks: number;

  constructor(board: Board, numRanks: number) {
    this.board = board;
    this.numRanks = numRanks;
  }

  select(position: Vector2): boolean {
    return position.y < this.numRanks;
  }
}

export class SelectTopRanks implements SquareSelectionRule {
  private board: Board;
  private numRanks: number;

  constructor(board: Board, numRanks: number) {
    this.board = board;
    this.numRanks = numRanks;
  }

  select(position: Vector2): boolean {
    return position.y >= this.board.boardConfiguration.dimensions.y - this.numRanks;
  }
}

export class SelectAround implements SquareSelectionRule {
  protected board: Board;
  private distance: number;

  constructor(board: Board, distance: number) {
    this.board = board;
    this.distance = distance;
  }

  select(position: Vector2, center: Vector2): boolean {
    let difference = position.subtract(center);
    return Math.abs(difference.x) <= this.distance && Math.abs(difference.y) <= this.distance;
  }
}

export class SelectDiagonalExtents extends SelectAround {

  constructor(board: Board, distance: number) {
    super(board, distance);
  }

  select(position: Vector2, center: Vector2): boolean {
    if (!super.select(position, center)) {
      return false;
    }

    let isOnCheckerboard = Math.abs(position.x - center.x) == Math.abs(position.y - center.y);
    let isCenter = position == center;

    return isOnCheckerboard && !isCenter;
  }
}

export class SelectDiagonalExtentsWithPieceBetween extends SelectDiagonalExtents {

  protected requiredBetweenPieceOwner?: Player;

  constructor(board: Board, distance: number) {
    if (distance < 2) {
      throw Error(`${SelectDiagonalExtentsWithPieceBetween.name} requires a distance of at least 2`);
    }
    super(board, distance);
  }

  protected checkIfOwnedByPlayer(square: Square) {
    return true;
  }

  select(position: Vector2, center: Vector2): boolean {
    if (!super.select(position, center)) {
      return false;
    }

    var selected = false;

    checkSquaresBetweenSquaresOnDiagonals((square: Square) => {
      if (selected) {
        return;
      }
      if (square != null && square.hasPawn()) {
        if (this.requiredBetweenPieceOwner == null) {
          selected = true;
        }

        if (this.checkIfOwnedByPlayer(square)) {
          selected = true;
        }
      }
    }, this.board, center, position);

    return selected;
  }
}


export class SelectDiagonalExtentsWithOtherThanCurrentPlayersPieceBetween extends SelectDiagonalExtentsWithPieceBetween {

  constructor(board: Board, distance: number, currentPlayer: Player) {
    super(board, distance);

    this.requiredBetweenPieceOwner = currentPlayer;
  }

  override checkIfOwnedByPlayer(square: Square): boolean {
    return square.getPawn()?.owner.name != this.requiredBetweenPieceOwner?.name ?? false;
  }
}

export class SelectDiagonalExtentsWithCurrentPlayersPieceBetween extends SelectDiagonalExtentsWithPieceBetween {

  constructor(board: Board, distance: number, currentPlayer: Player) {
    super(board, distance);

    this.requiredBetweenPieceOwner = currentPlayer;
  }

  override checkIfOwnedByPlayer(square: Square): boolean {
    return square.getPawn()?.owner.name == this.requiredBetweenPieceOwner?.name ?? false;
  }
}