import { GameManager } from "../gameManager";
import { Cpu } from "./cpu";

export enum PlayerSide {
  WHITE, 
  BLACK
}

export enum PlayerController {
  PLAYER,
  CPU
}

export type PlayerId = string; 

export class Player {
  name: PlayerId;
  playerSide: PlayerSide;

  constructor(name: PlayerId, playerSide: PlayerSide) {
    this.name = name;
    this.playerSide = playerSide; 
  }

}

export class CpuPlayer extends Player {
  cpu: Cpu;

  constructor(name: PlayerId, playerSide: PlayerSide, gameManager: GameManager) {
    super(name, playerSide);
    this.cpu = new Cpu(this, gameManager);
  }
}