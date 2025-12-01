import {
  element,
  interaction,
  type DSLElementDefinition,
  type InteractionDefinition,
} from "./element-dsl";
import {
  EMPTY,
  SAND,
  WATER,
  SOIL,
  LAVA,
  FIRE,
  SEED,
  PLANT,
  STEAM,
} from "./element-constants";

// Element definitions using DSL
export const ELEMENT_DSL_DEFINITIONS: DSLElementDefinition[] = [
  // Empty - static
  element("Empty").color(50, 50, 50).static().build(),

  // Sand - simple falling powder
  element("Sand").color(200, 180, 100).falling(2).build(),

  // Water - flowing liquid
  element("Water").color(120, 120, 210).falling(20).build(),

  // Soil - slow falling powder
  element("Soil").color(100, 100, 100).falling(1).build(),

  // Lava - slow flowing liquid
  element("Lava").color(200, 70, 70).falling(5).build(),

  // Fire - rises and spreads
  element("Fire")
    .color(255, 150, 0)
    .behavior()
    .when("above_is_empty")
    .moveTo("above")
    .withProbability(0.98)
    .when({ above_is: WATER })
    .set("above", EMPTY)
    .disappear()
    .otherwise()
    .stayWith(0.98)
    .spread()
    .toAdjacent(PLANT)
    .become(FIRE)
    .withProbability(0.3)
    .build()
    .build(),

  // Seed - falls and grows on soil
  element("Seed")
    .color(139, 90, 43)
    .behavior()
    .when({ adjacent_is: SOIL })
    .become(PLANT)
    .fallbackToFalling(2)
    .build()
    .build(),

  // Plant - stays and grows
  element("Plant")
    .color(34, 139, 34)
    .behavior()
    .otherwise()
    .stayWith(1.0)
    .grow()
    .upward()
    .when("above_is_empty")
    .withProbability(0.01)
    .increasedBy(3, "has_water_nearby")
    .limitBy("nearby_plants", { max: 8 })
    .grow()
    .horizontal()
    .when("left_is_empty")
    .withProbability(0.005)
    .increasedBy(3, "has_water_nearby")
    .limitBy("nearby_plants", { max: 8 })
    .build()
    .build(),

  // Steam - rises and condenses
  element("Steam")
    .color(200, 200, 200)
    .behavior()
    .when("above_is_empty")
    .moveTo("above")
    .withProbability(0.995)
    .when("above_is_empty")
    .disappear()
    .withProbability(0.005)
    .when("above_is_blocked")
    .become(WATER)
    .withProbability(0.7)
    .when("above_is_blocked")
    .disappear()
    .withProbability(0.05)
    .when("above_is_blocked")
    .stayWith(0.25)
    .when("at_top_boundary")
    .become(WATER)
    .withProbability(0.8)
    .when("at_top_boundary")
    .disappear()
    .withProbability(0.2)
    .otherwise()
    .become(WATER)
    .withProbability(0.14)
    .otherwise()
    .disappear()
    .withProbability(0.01)
    .otherwise()
    .stayWith(0.85)
    .build()
    .build(),
];

// Interaction definitions using DSL
export const INTERACTION_DSL_DEFINITIONS: InteractionDefinition[] = [
  // Water + Lava = Steam + Sand
  interaction("Water", "Lava").transforms(STEAM, SAND).build(),

  // Lava + Plant = Lava + Fire
  interaction("Lava", "Plant").transforms(LAVA, FIRE).skipProcessing().build(),

  // Water + Fire = Steam + Fire
  interaction("Water", "Fire").transforms(STEAM, FIRE).build(),
];
