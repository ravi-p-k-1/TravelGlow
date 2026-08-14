import { coldRule } from "./rules/coldRule.js";
import { heatRule } from "./rules/heatRule.js";
import { humidityRule } from "./rules/humidityRule.js";
import { hydrationRule } from "./rules/hydrationRule.js";
import { uvRule } from "./rules/uvRule.js";
import type { ConcernLevel, SkinConcernForecast, SkinRule, TravelSkinInput } from "./types.js";

export const SKIN_ENGINE_VERSION = "1.0.0";
const rules: SkinRule[] = [uvRule, humidityRule, hydrationRule, heatRule, coldRule];
const priority: Record<ConcernLevel, number> = { high: 3, moderate: 2, low: 1 };

export function runTravelSkinEngine(input: TravelSkinInput): SkinConcernForecast[] {
  return rules
    .map((rule) => rule(input))
    .filter((concern): concern is SkinConcernForecast => concern !== null)
    .sort((a, b) => priority[b.level] - priority[a.level]);
}
