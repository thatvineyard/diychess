import { Square } from "../square";
import { Piece } from "./piece";

export enum MoveTag {
  MOVEMENT,
  CAPTURE,
  CANCEL,
  JUMP,
};

export type MoveOptions = {
  doNotEndTurn: boolean;
}

const DEFAULT_MOVE_OPTIONS: MoveOptions = {
  doNotEndTurn: false,
}
const CANCEL_MOVE_OPTIONS: MoveOptions = {
  doNotEndTurn: true,
}

export abstract class Move {

  public piece: Piece;
  public origin: Square;
  public target: Square;
  public options: MoveOptions;
  protected moveTags: MoveTag[] = [];

  constructor(piece: Piece, origin: Square, target: Square, options: MoveOptions = DEFAULT_MOVE_OPTIONS) {
    this.piece= piece;
    this.origin = origin;
    this.target = target;
    this.options = options;
  }
}

export class MovementMove extends Move {
  protected moveTags: MoveTag[] = [...this.moveTags, MoveTag.MOVEMENT];
}

export class CaptureMove extends Move {
  protected moveTags: MoveTag[] = [...this.moveTags, MoveTag.CAPTURE];

  public captureSquare: Square;

  constructor(piece: Piece, origin: Square, target: Square, options?: MoveOptions) {
    super(piece, origin, target, options);
    this.captureSquare = target;
  }
  
}

export class CancelMove extends Move {
  protected moveTags: MoveTag[] = [...this.moveTags, MoveTag.CANCEL];

  constructor(piece: Piece, origin: Square, target: Square, options?: MoveOptions) {
    
    if(!options) {
      options = CANCEL_MOVE_OPTIONS;
    }
    super(piece, origin, target, options);
  }
}