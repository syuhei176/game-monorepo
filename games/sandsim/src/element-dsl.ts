import type { PowderType } from "./element-constants";

// DSL types for behavior rules
export type Direction = "above" | "below" | "left" | "right";
export type Condition =
  | "above_is_empty"
  | "below_is_empty"
  | "left_is_empty"
  | "right_is_empty"
  | "above_is_water"
  | "at_top_boundary"
  | "at_bottom_boundary"
  | { adjacent_is: PowderType }
  | { above_is: PowderType }
  | { below_is: PowderType }
  | "has_water_nearby"
  | "not_too_crowded";

export type Action =
  | { type: "moveTo"; direction: Direction }
  | { type: "set"; direction: Direction; element: PowderType }
  | { type: "disappear" }
  | { type: "stay" }
  | { type: "become"; element: PowderType }
  | { type: "fall"; viscosity: number };

export interface BehaviorRule {
  condition?: Condition;
  actions: Array<{ action: Action; probability: number }>;
}

export interface SpreadRule {
  targetElement: PowderType;
  becomeElement: PowderType;
  probability: number;
}

export interface GrowthRule {
  direction: "upward" | "horizontal";
  condition?: Condition;
  probability: number;
  modifiers?: Array<{ factor: number; condition: Condition }>;
  limit?: { type: "nearby_plants"; max: number };
}

export interface ElementBehavior {
  type: "static" | "falling" | "custom";
  viscosity?: number;
  rules?: BehaviorRule[];
  spreadRules?: SpreadRule[];
  growthRules?: GrowthRule[];
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface DSLElementDefinition {
  name: string;
  color: RGB;
  behavior: ElementBehavior;
}

// Behavior builder for creating behavior rules
class BehaviorBuilder {
  private rules: BehaviorRule[] = [];
  private spreadRules: SpreadRule[] = [];
  private growthRules: GrowthRule[] = [];
  private elementBuilder: ElementBuilder;
  private behaviorType: "static" | "falling" | "custom" = "custom";
  private viscosityValue: number = 0;

  constructor(elementBuilder: ElementBuilder) {
    this.elementBuilder = elementBuilder;
  }

  when(condition: Condition): RuleBuilder {
    return new RuleBuilder(this, condition);
  }

  otherwise(): RuleBuilder {
    return new RuleBuilder(this);
  }

  stay(): this {
    this.behaviorType = "static";
    return this;
  }

  fall(viscosity: number): this {
    this.behaviorType = "falling";
    this.viscosityValue = viscosity;
    return this;
  }

  fallbackToFalling(viscosity: number): this {
    this.viscosityValue = viscosity;
    return this;
  }

  spread(): SpreadBuilder {
    return new SpreadBuilder(this);
  }

  grow(): GrowthBuilder {
    return new GrowthBuilder(this);
  }

  addRule(rule: BehaviorRule): this {
    this.rules.push(rule);
    return this;
  }

  addSpreadRule(rule: SpreadRule): this {
    this.spreadRules.push(rule);
    return this;
  }

  addGrowthRule(rule: GrowthRule): this {
    this.growthRules.push(rule);
    return this;
  }

  build(): ElementBuilder {
    this.elementBuilder.setBehavior({
      type: this.behaviorType,
      viscosity: this.viscosityValue,
      rules: this.rules.length > 0 ? this.rules : undefined,
      spreadRules: this.spreadRules.length > 0 ? this.spreadRules : undefined,
      growthRules: this.growthRules.length > 0 ? this.growthRules : undefined,
    });
    return this.elementBuilder;
  }
}

// Rule builder for when/otherwise clauses
class RuleBuilder {
  private behaviorBuilder: BehaviorBuilder;
  private condition?: Condition;
  private actions: Array<{ action: Action; probability: number }> = [];
  private currentProbability: number = 1.0;

  constructor(behaviorBuilder: BehaviorBuilder, condition?: Condition) {
    this.behaviorBuilder = behaviorBuilder;
    this.condition = condition;
  }

  moveTo(direction: Direction): this {
    this.actions.push({
      action: { type: "moveTo", direction },
      probability: this.currentProbability,
    });
    return this;
  }

  set(direction: Direction, element: PowderType): this {
    this.actions.push({
      action: { type: "set", direction, element },
      probability: this.currentProbability,
    });
    return this;
  }

  disappear(): this {
    this.actions.push({
      action: { type: "disappear" },
      probability: this.currentProbability,
    });
    return this;
  }

  stayWith(probability: number): this {
    this.currentProbability = probability;
    this.actions.push({
      action: { type: "stay" },
      probability: this.currentProbability,
    });
    return this;
  }

  become(element: PowderType): this {
    this.actions.push({
      action: { type: "become", element },
      probability: this.currentProbability,
    });
    return this;
  }

  withProbability(probability: number): this {
    if (this.actions.length > 0) {
      this.actions[this.actions.length - 1].probability = probability;
    }
    this.currentProbability = probability;
    return this;
  }

  when(condition: Condition): RuleBuilder {
    this.finalize();
    return this.behaviorBuilder.when(condition);
  }

  otherwise(): RuleBuilder {
    this.finalize();
    return this.behaviorBuilder.otherwise();
  }

  spread(): SpreadBuilder {
    this.finalize();
    return this.behaviorBuilder.spread();
  }

  grow(): GrowthBuilder {
    this.finalize();
    return this.behaviorBuilder.grow();
  }

  fallbackToFalling(viscosity: number): BehaviorBuilder {
    this.finalize();
    return this.behaviorBuilder.fallbackToFalling(viscosity);
  }

  build(): ElementBuilder {
    this.finalize();
    return this.behaviorBuilder.build();
  }

  private finalize(): void {
    if (this.actions.length > 0) {
      this.behaviorBuilder.addRule({
        condition: this.condition,
        actions: this.actions,
      });
    }
  }
}

// Spread builder for spread rules
class SpreadBuilder {
  private behaviorBuilder: BehaviorBuilder;
  private targetElement?: PowderType;
  private becomeElement?: PowderType;
  private probability: number = 1.0;

  constructor(behaviorBuilder: BehaviorBuilder) {
    this.behaviorBuilder = behaviorBuilder;
  }

  toAdjacent(element: PowderType): this {
    this.targetElement = element;
    return this;
  }

  become(element: PowderType): this {
    this.becomeElement = element;
    return this;
  }

  withProbability(probability: number): this {
    this.probability = probability;
    return this;
  }

  when(condition: Condition): RuleBuilder {
    this.finalize();
    return this.behaviorBuilder.when(condition);
  }

  otherwise(): RuleBuilder {
    this.finalize();
    return this.behaviorBuilder.otherwise();
  }

  spread(): SpreadBuilder {
    this.finalize();
    return this.behaviorBuilder.spread();
  }

  grow(): GrowthBuilder {
    this.finalize();
    return this.behaviorBuilder.grow();
  }

  build(): ElementBuilder {
    this.finalize();
    return this.behaviorBuilder.build();
  }

  private finalize(): void {
    if (this.targetElement !== undefined && this.becomeElement !== undefined) {
      this.behaviorBuilder.addSpreadRule({
        targetElement: this.targetElement,
        becomeElement: this.becomeElement,
        probability: this.probability,
      });
    }
  }
}

// Growth builder for growth rules
class GrowthBuilder {
  private behaviorBuilder: BehaviorBuilder;
  private direction?: "upward" | "horizontal";
  private condition?: Condition;
  private probability: number = 1.0;
  private modifiers: Array<{ factor: number; condition: Condition }> = [];
  private limit?: { type: "nearby_plants"; max: number };

  constructor(behaviorBuilder: BehaviorBuilder) {
    this.behaviorBuilder = behaviorBuilder;
  }

  upward(): this {
    this.direction = "upward";
    return this;
  }

  horizontal(): this {
    this.direction = "horizontal";
    return this;
  }

  when(condition: Condition): this {
    this.condition = condition;
    return this;
  }

  withProbability(probability: number): this {
    this.probability = probability;
    return this;
  }

  increasedBy(factor: number, condition: Condition): this {
    this.modifiers.push({ factor, condition });
    return this;
  }

  limitBy(type: "nearby_plants", options: { max: number }): this {
    this.limit = { type, max: options.max };
    return this;
  }

  grow(): GrowthBuilder {
    this.finalize();
    return this.behaviorBuilder.grow();
  }

  spread(): SpreadBuilder {
    this.finalize();
    return this.behaviorBuilder.spread();
  }

  when_rule(condition: Condition): RuleBuilder {
    this.finalize();
    return this.behaviorBuilder.when(condition);
  }

  build(): ElementBuilder {
    this.finalize();
    return this.behaviorBuilder.build();
  }

  private finalize(): void {
    if (this.direction) {
      this.behaviorBuilder.addGrowthRule({
        direction: this.direction,
        condition: this.condition,
        probability: this.probability,
        modifiers: this.modifiers.length > 0 ? this.modifiers : undefined,
        limit: this.limit,
      });
    }
  }
}

// Main element builder
class ElementBuilder {
  private name: string;
  private colorValue?: RGB;
  private behaviorValue?: ElementBehavior;

  constructor(name: string) {
    this.name = name;
  }

  color(r: number, g: number, b: number): this {
    this.colorValue = { r, g, b };
    return this;
  }

  falling(viscosity: number): this {
    this.behaviorValue = {
      type: "falling",
      viscosity,
    };
    return this;
  }

  static(): this {
    this.behaviorValue = {
      type: "static",
      viscosity: 0,
    };
    return this;
  }

  behavior(): BehaviorBuilder {
    return new BehaviorBuilder(this);
  }

  setBehavior(behavior: ElementBehavior): this {
    this.behaviorValue = behavior;
    return this;
  }

  build(): DSLElementDefinition {
    if (!this.colorValue) {
      throw new Error(`Element ${this.name} must have a color`);
    }
    if (!this.behaviorValue) {
      throw new Error(`Element ${this.name} must have a behavior`);
    }
    return {
      name: this.name,
      color: this.colorValue,
      behavior: this.behaviorValue,
    };
  }
}

// Main DSL entry point
export function element(name: string): ElementBuilder {
  return new ElementBuilder(name);
}

// Interaction builder
export interface InteractionDefinition {
  element1: string;
  element2: string;
  result1: PowderType;
  result2: PowderType;
  skipProcessing?: boolean;
}

class InteractionBuilder {
  private element1: string;
  private element2: string;
  private result1?: PowderType;
  private result2?: PowderType;
  private skipProcessingFlag: boolean = false;

  constructor(element1: string, element2: string) {
    this.element1 = element1;
    this.element2 = element2;
  }

  transforms(result1: PowderType, result2: PowderType): this {
    this.result1 = result1;
    this.result2 = result2;
    return this;
  }

  skipProcessing(): this {
    this.skipProcessingFlag = true;
    return this;
  }

  build(): InteractionDefinition {
    if (this.result1 === undefined || this.result2 === undefined) {
      throw new Error(
        `Interaction between ${this.element1} and ${this.element2} must specify transformation results`,
      );
    }
    return {
      element1: this.element1,
      element2: this.element2,
      result1: this.result1,
      result2: this.result2,
      skipProcessing: this.skipProcessingFlag,
    };
  }
}

export function interaction(
  element1: string,
  element2: string,
): InteractionBuilder {
  return new InteractionBuilder(element1, element2);
}
