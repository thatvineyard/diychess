import { Vector2 } from "@babylonjs/core";
import { Square } from "./square";
import { Board } from "./board";

export function checkSquaresBetweenSquaresOnDiagonals(callback: (square: Square) => void, board: Board, from: Vector2, to: Vector2) {
  
  let betweenSquares = to.subtract(from);

  if (Math.abs(betweenSquares.x) != Math.abs(betweenSquares.y)) {
    throw new Error(`Expected only diagonal, was {from: ${from}, to: ${to}, betweenSquares: ${betweenSquares}}`);
  }

  let betweenSquaresUnitVector = new Vector2();
  betweenSquaresUnitVector.x = betweenSquares.x / Math.abs(betweenSquares.x);
  betweenSquaresUnitVector.y = betweenSquares.y / Math.abs(betweenSquares.y);

  while (betweenSquares.length() > 0) {
    let checkPosition = from.add(betweenSquaresUnitVector);
    let square = board.getSquare(checkPosition);
    if(square != null) {
      callback(square);
    }
    betweenSquares = betweenSquares.subtract(betweenSquaresUnitVector);
  }
  return false;
}