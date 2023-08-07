import { Color3, Material, StandardMaterial } from "@babylonjs/core";
import { Move, MoveType } from "../board/pawn/move";

const defaultHighlightColors = new Map<MoveType, Color3>([
  [MoveType.MOVE, Color3.FromHexString("#00ff00")],
  [MoveType.RESET, Color3.FromHexString("#0000ff")],
  [MoveType.ATTACK, Color3.FromHexString("#ff0000")],
]);

const defaultWhitePawnBaseColor = Color3.FromHexString("#f0e7d3");
const defaultBlackPawnBaseColor = Color3.FromHexString("#252529");

const defaultWhiteSquareColor = Color3.FromHexString("#b4aa94");
const defaultBlackSquareColor = Color3.FromHexString("#2d2d34");

export class PawnMaterialGroup {
  base: StandardMaterial;
  ghost: StandardMaterial;
  moveGhostHighlight: StandardMaterial;
  resetGhostHighlight: StandardMaterial;
  attackGhostHighlight: StandardMaterial;


  constructor(name: string, baseColor: Color3, ghostTransparency = 0.2, highlightTransparency = 0.4, highlightColors: Map<MoveType, Color3> = defaultHighlightColors) {
    this.base = new StandardMaterial(`${name}-base`);
    this.base.diffuseColor = baseColor;
    
    this.ghost = this.base.clone(`${name}-ghost`);
    this.ghost.diffuseColor = baseColor.add(Color3.FromHexString("#999999"));
    this.ghost.alpha = ghostTransparency;
    
    this.moveGhostHighlight = this.ghost.clone(`${name}-ghost-move`);
    this.moveGhostHighlight.alpha = highlightTransparency;
    if(highlightColors.has(MoveType.MOVE)) {
      this.moveGhostHighlight.diffuseColor = highlightColors.get(MoveType.MOVE)!;
    }
    this.resetGhostHighlight = this.ghost.clone(`${name}-ghost-reset`);
    this.resetGhostHighlight.alpha = highlightTransparency;
    if(highlightColors.has(MoveType.RESET)) {
      this.moveGhostHighlight.diffuseColor = highlightColors.get(MoveType.RESET)!;
    }
    this.attackGhostHighlight = this.ghost.clone(`${name}-ghost-attack`);
    this.attackGhostHighlight.alpha = highlightTransparency;
    if(highlightColors.has(MoveType.ATTACK)) {
      this.attackGhostHighlight.diffuseColor = highlightColors.get(MoveType.ATTACK)!;
    }
  }

}

class BoardMaterialGroup {
  public whiteSquare: StandardMaterial;
  public blackSquare: StandardMaterial;

  constructor() {
    this.whiteSquare = new StandardMaterial("whiteSquare");
    this.whiteSquare.diffuseColor = defaultWhiteSquareColor;
    
    this.blackSquare = new StandardMaterial("blackSquare");
    this.blackSquare.diffuseColor = defaultBlackSquareColor;
  }
}

export class materialManager {

  public whitePawnMaterialGroup = new PawnMaterialGroup("white", defaultWhitePawnBaseColor);
  public blackPawnMaterialGroup = new PawnMaterialGroup("black", defaultBlackPawnBaseColor);

  public boardMaterialGroup = new BoardMaterialGroup();

}