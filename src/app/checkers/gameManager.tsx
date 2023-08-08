import { Scene, Vector2, Vector3 } from "@babylonjs/core";
import { Board } from "./board/board";
import { CpuPlayer, Player, PlayerController, PlayerSide } from "./player";
import { GameEngine } from "./engine/engine";

export enum TurnType {
  WHITE_TURN,
  BLACK_TURN,
}

export class GameManager {

  public whitePlayer: Player;
  public blackPlayer: Player;

  private turn: number;
  private turnType: TurnType;

  private board: Board;

  private gameEngine: GameEngine;

  public onNextTurn: () => void = () => { };

  private boardConfiguration = {
    dimensions: new Vector2(5, 5),
    originTileIsBlack: true,
    meshSize: new Vector3(10, 10, 0.5),
    borderSize: 1,
  }

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
    this.whitePlayer = new Player("white", PlayerSide.WHITE);
    this.blackPlayer = new CpuPlayer("black", PlayerSide.BLACK);

    this.turn = 0;

    this.turnType = TurnType.WHITE_TURN;

    this.board = new Board('board', this.boardConfiguration, this, this.gameEngine);
  }

  public nextTurn() {
    this.turn++;
    this.turnType = this.getNextTurnType(this.turnType);
    this.onNextTurn();
    this.startTurn();
  }

  public startTurn() {
    let currentPlayer = this.getCurrentPlayer()
    if (currentPlayer instanceof CpuPlayer) {
      currentPlayer.cpu.takeTurn(() => {
        this.nextTurn();
      },this.board);
    }
  }

  public getCurrentPlayer() {
    switch (this.turnType) {
      case TurnType.WHITE_TURN:
        return this.whitePlayer;
      case TurnType.BLACK_TURN:
        return this.blackPlayer;
    }
  }

  private getNextTurnType(currentTurnType: TurnType) {
    switch (this.turnType) {
      case TurnType.WHITE_TURN:
        return TurnType.BLACK_TURN;
      case TurnType.BLACK_TURN:
        return TurnType.WHITE_TURN;
    }
  }

  public reset() {
    this.board.dispose();
    this.board = new Board('board', this.boardConfiguration, this, this.gameEngine);
  }

}