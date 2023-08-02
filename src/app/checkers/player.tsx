import { Cpu } from "./cpu";

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

  constructor(name: string, playerSide: PlayerSide) {
    this.name = name;
    this.playerSide = playerSide; 
  }

}

export class CpuPlayer extends Player {
  cpu: Cpu;

  constructor(name: string, playerSide: PlayerSide) {
    super(name, playerSide);
    this.cpu = new Cpu(this);
  }
}