import { Move } from "./board/piece/move";
import { Player } from "./player/player";

export class Turn {

  activePlayer: Player;
  moves: Array<Move>;
  nextTurn?: Turn;
  previousTurn?: Turn;

  constructor(activePlayer: Player, previousTurn?: Turn) {
    this.activePlayer = activePlayer;
    this.moves = new Array();
    this.previousTurn = previousTurn;
  }
}