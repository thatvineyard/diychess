import { Player } from "./player/player";

export class Turn {

  activePlayer: Player;
  nextTurn?: Turn;
  previousTurn?: Turn;

  constructor(activePlayer: Player, previousTurn?: Turn) {
    this.previousTurn = previousTurn;
    this.activePlayer = activePlayer;
  }
}