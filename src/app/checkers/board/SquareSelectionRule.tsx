import { Vector2 } from "@babylonjs/core";
import { Board } from "./board";

export interface SquareSelectionRule {
  select(position: Vector2, center?: Vector2): boolean
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
  private board: Board;
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
    let isOnCheckerboard = (position.x % 2 === position.y % 2) !== (center.x % 2 === 0);
    if(!isOnCheckerboard) {
      return false 
    }
    
    return super.select(position, center);
  }
}