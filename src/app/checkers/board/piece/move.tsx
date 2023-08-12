import { Square } from "../square";

export abstract class Move {

  public target: Square;

  constructor(target: Square) {
    this.target = target;
  }
}

export class MovementMove extends Move {

}
export class CaptureMove extends Move {

  public captureSquare: Square;

  constructor(target: Square) {
    super(target);
    this.captureSquare = target;
  }
  
}

export class CancelMove extends Move {

}