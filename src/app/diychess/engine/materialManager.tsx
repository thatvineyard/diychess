import { Color3, Material, Scene, StandardMaterial } from "@babylonjs/core";
import { GameEngine, GameEngineError } from "./gameEngine";

type HightlightColors = {
  movement: Color3,
  capture: Color3,
  cancel: Color3,
}

const defaultHighlightColors = {
  movement: Color3.FromHexString("#00ff00"),
  capture: Color3.FromHexString("#ff0000"),
  cancel: Color3.FromHexString("#0000ff"),
};

const defaultWhitePawnBaseColor = Color3.FromHexString("#f0e7d3");
const defaultBlackPawnBaseColor = Color3.FromHexString("#252529");

const defaultWhiteSquareColor = Color3.FromHexString("#b4aa94");
const defaultBlackSquareColor = Color3.FromHexString("#2d2d34");

export class PieceMaterialGroup {
  base: StandardMaterial;
  ghost: StandardMaterial;
  movementGhostHighlight: StandardMaterial;
  cancelGhostHighlight: StandardMaterial;
  captureGhostHighlight: StandardMaterial;


  constructor(name: string, baseColor: Color3, ghostTransparency = 0.2, highlightTransparency = 0.4, highlightColors: HightlightColors = defaultHighlightColors, scene: Scene) {
    this.base = new StandardMaterial(`${name}-base`, scene);
    this.base.diffuseColor = baseColor;
    
    this.ghost = this.base.clone(`${name}-ghost`);
    this.ghost.diffuseColor = baseColor.add(Color3.FromHexString("#999999"));
    this.ghost.alpha = ghostTransparency;
    
    this.movementGhostHighlight = this.ghost.clone(`${name}-ghost-move`);
    this.movementGhostHighlight.alpha = highlightTransparency;
    this.movementGhostHighlight.diffuseColor = highlightColors.movement;
    
    this.cancelGhostHighlight = this.ghost.clone(`${name}-ghost-reset`);
    this.cancelGhostHighlight.alpha = highlightTransparency;
    this.cancelGhostHighlight.diffuseColor = highlightColors.cancel;
    
    this.captureGhostHighlight = this.ghost.clone(`${name}-ghost-attack`);
    this.captureGhostHighlight.alpha = highlightTransparency;
    this.captureGhostHighlight.diffuseColor = highlightColors.capture;
  }

}

class BoardMaterialGroup {
  public whiteSquare: StandardMaterial;
  public blackSquare: StandardMaterial;

  constructor(scene: Scene) {
    this.whiteSquare = new StandardMaterial("whiteSquare", scene);
    this.whiteSquare.diffuseColor = defaultWhiteSquareColor;
    
    this.blackSquare = new StandardMaterial("blackSquare", scene);
    this.blackSquare.diffuseColor = defaultBlackSquareColor;
  }
}

export class MaterialManager {

  private gameEngine: GameEngine;

  public whitePawnMaterialGroup;
  public blackPawnMaterialGroup;

  public boardMaterialGroup;

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
    if(!this.gameEngine.scene) {
      throw new GameEngineError("Can not create material manager before scene is loaded");
    }
    this.boardMaterialGroup = new BoardMaterialGroup(this.gameEngine.scene);
    this.whitePawnMaterialGroup = new PieceMaterialGroup("white", defaultWhitePawnBaseColor, undefined, undefined, undefined, this.gameEngine.scene);
    this.blackPawnMaterialGroup = new PieceMaterialGroup("black", defaultBlackPawnBaseColor, undefined, undefined, undefined, this.gameEngine.scene);
  }

}