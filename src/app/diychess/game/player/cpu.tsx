import { Vector2 } from "@babylonjs/core";
import { Board } from "../board/board";
import { CheckersCaptureMove, CheckersJumpMove, CheckersPawn } from "../board/piece/checkersPawn";
import { CancelMove, CaptureMove, Move, MoveTag, MovementMove } from "../board/piece/move";
import { Piece } from "../board/piece/piece";
import { GameManager, GameRuleError } from "../gameManager";
import { Player } from "./player";

type MoveChoice = {
  move: Move,
  weight: number,
}

export class MoveChoices {
  private moveChoices: Array<MoveChoice>;
  private maxWeigth: number;

  constructor() {
    this.moveChoices = new Array();
    this.maxWeigth = -Number.MAX_VALUE;
  }

  public numberOfChoices() {
    return this.moveChoices.length;
  }

  public addMove(move: Move, weight: number) {
    this.moveChoices.push({ move, weight });
    if (weight > this.maxWeigth) {
      this.maxWeigth = weight;
    }
  }

  public chooseMove() {
    if (this.numberOfChoices() <= 0) {
      throw new GameRuleError(`No possible moves`);
    }
    let maxWeigthChoices = this.moveChoices
      .filter(moveChoice => moveChoice.weight == this.maxWeigth)
      .map(moveChoice => moveChoice.move);

    return maxWeigthChoices.at(Math.floor(Math.random() * maxWeigthChoices.length))!;
  }

}


export class Cpu {

  private player: Player;
  private gameManager: GameManager;

  constructor(player: Player, gameManager: GameManager) {
    this.player = player;
    this.gameManager = gameManager;
  }

  public async takeTurn(board: Board) {
    let moveChoices = new MoveChoices();
    let moveDone = false;

    board.foreachPawn((piece: Piece) => {
      piece.calcAvailableMoves();
      this.addPieceMovesToMoveChoices(piece, moveChoices);
    }, this.player);

    let chosenMove = moveChoices.chooseMove();

    return this.performMove(chosenMove, board);

  }

  private async performMove(move: Move, board: Board) {
    board.selectPiece(move.piece);

    return new Promise<void>(resolve =>
      setTimeout(() => {
        if (move instanceof CaptureMove) {
          board.capturePawn(move.captureSquare);
        }
        move.piece!.place(move.target);

        if (!(move instanceof CancelMove)) {
          this.gameManager.registerMove(move);
        }

        setTimeout(() => {
          if (!move.options.doNotEndTurn) {
            board.removeAvailableMoves();
            resolve();
            return;
          }

          let moveTagFilter: MoveTag[] = [MoveTag.CANCEL, MoveTag.JUMP]
          board.createAvailableMoves([move.origin.coordinate], moveTagFilter);

          if (!board.hasAvailableMoves() || board.allAvailableMovesAreCancel()) {
            board.removeAvailableMoves();
            resolve();
            return;
          }

          board.selectPiece(move.piece);

          let moveChoices = new MoveChoices();
          this.addPieceMovesToMoveChoices(move.piece, moveChoices);

          if (moveChoices.numberOfChoices() >= 0) {
            let chosenMove = moveChoices.chooseMove();
            return this.performMove(chosenMove, board).then(resolve);
          }
        }, 300);
      }, 300)
    );
  }

  private addPieceMovesToMoveChoices(piece: Piece, moveChoices: MoveChoices) {
    if (!piece.canBePlayedBy(this.player)) {
      throw new GameRuleError("unexpected piece owner");
    }
    piece.availableMoves.forEach(move => {
      if (move.move instanceof MovementMove) {
        moveChoices.addMove(move.move, 1);
        return;
      }
      if (move.move instanceof CaptureMove) {
        moveChoices.addMove(move.move, 2);
        return;
      }
      if (move.move instanceof CancelMove) {
        moveChoices.addMove(move.move, -1);
        return;
      }
      throw new GameRuleError("Unexpected type of move");
    });
  }
}