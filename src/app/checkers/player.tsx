export enum PlayerSide {
  WHITE, 
  BLACK
}

export enum PlayerController {
  PLAYER,
  CPU
}

export class Player {
  name: string;
  playerSide: PlayerSide;
  playerController: PlayerController;

  constructor(name: string, playerSide: PlayerSide, playerController: PlayerController) {
    this.name = name;
    this.playerSide = playerSide; 
    this.playerController = playerController;
  }

}