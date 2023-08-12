import { Vector2 } from "@babylonjs/core";
import { SquareSelectionRule } from "./squareSelectionRule";

export class SquareSelectionRuleSet {

  private additiveRules: Array<SquareSelectionRule>;
  private maskingRules: Array<SquareSelectionRule>;

  constructor() {
    this.additiveRules = new Array();
    this.maskingRules = new Array();
  }

  public addAdditiveRule(rule: SquareSelectionRule, ) {
    this.additiveRules.push(rule);
  }

  public addMaskingRule(rule: SquareSelectionRule, ) {
    this.maskingRules.push(rule);
  }

  private selectFromAdditiveRules(position: Vector2, center?: Vector2) {
    if(this.additiveRules.length == 0) {
      return false;
    }
    
    let anyRuleWasFalse = this.additiveRules.every(rule => {
      return !rule.select(position, center);
    });
    
    return !anyRuleWasFalse;
  }

  private selectFromMaskingRules(position: Vector2, center?: Vector2) {
    if(this.maskingRules.length == 0) {
      return true;
    }

    let anyRuleWasFalse = this.maskingRules.every(rule => {
      return rule.select(position, center);
    });

    return anyRuleWasFalse;
  }

  public select(position: Vector2, center?: Vector2) {
    return this.selectFromAdditiveRules(position, center) && this.selectFromMaskingRules(position, center);
  }

}