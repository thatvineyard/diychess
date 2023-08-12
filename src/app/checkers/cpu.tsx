import { Board } from "./board/board";
import { CheckersPawn } from "./board/piece/checkersPawn";
import { CaptureMove } from "./board/piece/move";
import { GameRuleError } from "./gameEngine";
import { Player } from "./player";

export class Cpu {

  player: Player;

  pawnWithMostMoves?: CheckersPawn;

  constructor(player: Player) {
    this.player = player;
  }

  public takeTurn(onEndTurn: () => void, board: Board) {
    this.pawnWithMostMoves = undefined;
    board.foreachPawn((pawn: CheckersPawn) => {
      if (pawn.canBePlayedBy(this.player)) {
        pawn.calcAvailableMoves();
        if (this.pawnWithMostMoves == null) {
          this.pawnWithMostMoves = pawn;
        } else {
          if (pawn.availableMoves.size > this.pawnWithMostMoves.availableMoves.size) {
            this.pawnWithMostMoves = pawn;
            return
          }
        }

      }
    }, this.player);

    if (this.pawnWithMostMoves == null) {
      throw new GameRuleError(`${this.player.name} had no useable pawns`);
      return;
    }

    this.pawnWithMostMoves.lift();

    setTimeout(() => {
      const selectMove = Math.floor(Math.random() * this.pawnWithMostMoves!.availableMoves.size);
      let move = Array.from(this.pawnWithMostMoves!.availableMoves)[selectMove][1].move;
      if(move instanceof CaptureMove) {
        board.capturePawn(move.target);
      }
      this.pawnWithMostMoves!.place(move.target);
      
      setTimeout(() => {
      onEndTurn();
      }, 300);
    }, 300);
  }
}