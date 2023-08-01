import { Scene, Vector2, Vector3 } from "@babylonjs/core";
import { Board } from "./board/board";
import { Player, PlayerController, PlayerSide } from "./player";

export enum TurnType {
  WHITE_TURN,
  BLACK_TURN,
}

export class GameManager {

  private whitePlayer: Player;
  private blackPlayer: Player;

  private turn: number;
  private turnType: TurnType;

  private board: Board;

  private scene: Scene;

  public onNextTurn: () => void = () => {};

  private boardConfiguration = {
    dimensions: new Vector2(10, 10),
    originTileIsBlack: true,
    meshSize: new Vector3(10, 10, 0.5),
    borderSize: 1,
  }

  constructor(scene: Scene) {
    this.scene = scene;
    this.whitePlayer = new Player("white", PlayerSide.WHITE, PlayerController.PLAYER);
    this.blackPlayer = new Player("black", PlayerSide.BLACK, PlayerController.PLAYER);

    this.turn = 0;

    this.turnType = TurnType.WHITE_TURN;

    this.board = new Board('board', this.boardConfiguration, this, scene);
  }

  public nextTurn() {
    this.turn++;
    this.turnType = this.getNextTurnType(this.turnType);
    this.onNextTurn();
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
    this.board = new Board('board', this.boardConfiguration, this, this.scene);
  }

}