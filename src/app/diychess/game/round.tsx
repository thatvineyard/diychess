import { Move } from "./board/piece/move";
import { GameRuleError, GameStateError } from "./gameManager";
import { Player } from "./player/player";
import { Turn } from "./turn";

export class Round {
  public readonly roundNumber: number;
  private activeTurn?: Turn;
  private playerQueue: Array<Player>;

  constructor(playerQueue: Array<Player>, previousRound?: Round) {
    this.playerQueue = playerQueue;
    if (previousRound != null) {
      this.roundNumber = previousRound.roundNumber + 1;
    } else {
      this.roundNumber = 0;
    }
  }

  setUpNextTurn() {
    if (this.onlastTurnOfRound()) {
      throw new Error("Tried setting up next turn when at end of player queue.");
    }
    let nextTurn = new Turn(this.dequeueNextPlayer());
    if (this.activeTurn) {
      this.activeTurn.nextTurn = nextTurn;
      nextTurn.previousTurn = this.activeTurn;
    }
    this.activeTurn = nextTurn;
  }

  private dequeueNextPlayer() {
    let nextPlayer = this.playerQueue.shift();
    if (!nextPlayer) {
      throw new Error("Player queue empty.");
    }
    return nextPlayer;
  }

  public onlastTurnOfRound() {
    return this.playerQueue.length <= 0;
  }

  public getLatestMove() {
    return this.activeTurn!.moves.at(this.activeTurn!.moves.length - 1);
  }

  public getCurrentPlayer() {
    if (!this.activeTurn) {
      throw new GameStateError("Turn not set up yet.");
    }
    return this.activeTurn.activePlayer;
  }

  public registerMove(move: Move) {
    if (!this.activeTurn) {
      throw new GameStateError("Turn not set up yet.");
    }
    this.activeTurn.moves.push(move);
  }

}