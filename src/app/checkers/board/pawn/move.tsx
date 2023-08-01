import { Square } from "../square";

export enum MoveType {
  MOVE,
  ATTACK,
  RESET
}

export class Move {

  public square: Square;
  public moveType: MoveType;

  constructor(square: Square, moveType: MoveType) {
    this.square = square;
    this.moveType = moveType;
  }
}