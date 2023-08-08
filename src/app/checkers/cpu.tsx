import { Board } from "./board/board";
import { MoveType } from "./board/pawn/move";
import { Pawn } from "./board/pawn/pawn";
import { GameRuleError } from "./gameEngine";
import { Player } from "./player";

export class Cpu {

  player: Player;

  pawnWithMostMoves?: Pawn;

  constructor(player: Player) {
    this.player = player;
  }

  public takeTurn(onEndTurn: () => void, board: Board) {
    this.pawnWithMostMoves = undefined;
    board.foreachPawn((pawn: Pawn) => {
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
      if(move.moveType == MoveType.ATTACK) {
        board.capturePawn(move.square);
      }
      this.pawnWithMostMoves!.place(move.square);
      
      setTimeout(() => {
      onEndTurn();
      }, 300);
    }, 300);
  }
}