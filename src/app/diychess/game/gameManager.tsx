import { Vector2, Vector3 } from "@babylonjs/core";
import { GameEngine, GameEngineError } from "../engine/gameEngine";
import { Board } from "./board/board";
import { CpuPlayer, Player, PlayerSide } from "./player/player";
import { Round } from "./round";
import { Move } from "./board/piece/move";

export enum TurnType {
  WHITE_TURN,
  BLACK_TURN,
}

const BOARD_CONFIG = {
  dimensions: new Vector2(8, 8),
  originTileIsBlack: true,
  meshSize: new Vector3(10, 10, 0.5),
  borderSize: 1,
}

export class GameManager {

  private players: Array<Player> = new Array();

  public whitePlayer: Player;
  public blackPlayer: Player;

  private rounds: Array<Round>;
  private currentRound?: Round;
  private playerOrder: Array<Player> = new Array();

  public board: Board;

  private gameEngine: GameEngine;

  private turnInProgress: Boolean;

  private gameEnded = false;

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
    this.addPlayer("white", PlayerSide.WHITE);
    this.addCpuPlayer("black", PlayerSide.BLACK);

    this.whitePlayer = this.players.at(0)!;
    this.blackPlayer = this.players.at(1)!;

    this.rounds = new Array();

    this.board = this.createBoard();

    this.turnInProgress = false;
  }

  private createBoard() {
    return new Board('board', BOARD_CONFIG, this, this.gameEngine);
  }


  public startGame() {
    this.setUpNextRound();
  }

  public renderLoop() {
    if(!this.turnInProgress) {
      this.startTurn();
    }
  }

  public setUpNextRound() {
    let playerQueue = this.generatePlayerQueue();
    if (this.currentRound == null) {
      this.currentRound = new Round(playerQueue);
      this.rounds.push(this.currentRound);
    } else {
      this.currentRound = new Round(playerQueue, this.currentRound);
      this.rounds.push(this.currentRound);
    }
    this.currentRound.setUpNextTurn();
  }

  public registerMove(move: Move) {
    this.currentRound?.activeTurn?.moves.push(move);
    
  }

  public getLatestMove() {
    return this.currentRound!.getLatestMove();
  }

  public getRound() {
    return this.currentRound;
  }

  public getTurn() {
    return this.currentRound?.activeTurn;
  }

  public startTurn() {
    this.turnInProgress = true;
    this.gameEngine.updateGui();
    let currentPlayer = this.getCurrentPlayer();
    if (currentPlayer instanceof CpuPlayer) {
      currentPlayer.cpu.takeTurn(this.board).then(() => {
        this.endTurn();
      });
    }
  }

  public endTurn() {
    if (!this.currentRound) {
      throw new GameEngineError("Tried ending a turn when no round had been set up.");
    }

    this.board.deselectPiece();

    if (this.currentRound.onlastTurnOfRound()) {
      this.setUpNextRound();
    } else {
      this.currentRound.setUpNextTurn();
    }
    this.turnInProgress = false;
  }

  private generatePlayerQueue() {
    let playerQueue = new Array<Player>();
    this.players.forEach(player => {
      playerQueue.push(player);
    });
    return playerQueue;
  }

  public getCurrentPlayer() {
    if (!this.currentRound) {
      throw new GameEngineError("Round not started");
    }
    if (!this.currentRound.activeTurn) {
      throw new GameEngineError("Turn not started");
    }
    return this.currentRound.activeTurn.activePlayer;
  }

  public addPlayer(name: string, side: PlayerSide) {
    this.players.push(new Player(name, side));
  }

  public addCpuPlayer(name: string, side: PlayerSide) {
    this.players.push(new CpuPlayer(name, side, this));
  }

  public reset() {
    this.board.dispose();
    this.board = this.createBoard();
  }

}


export class GameRuleError extends Error { }