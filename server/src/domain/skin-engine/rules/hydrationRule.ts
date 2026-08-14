import { skinEngineThresholds as threshold } from "../thresholds.js";
import type { SkinRule } from "../types.js";

export const hydrationRule: SkinRule = ({ skinAnalysis, destinationEnvironment }) => {
  const humidity = destinationEnvironment.humidity;
  const hydration = skinAnalysis.hydration;
  if (humidity === undefined || humidity > threshold.lowHumidity) return null;

  const lowHydration = hydration !== undefined && hydration <= threshold.lowHydration;
  return {
    id: "hydration",
    concern: "Hydration",
    level: lowHydration ? "high" : "moderate",
    factors: [
      `Destination humidity is low at ${humidity}%`,
      ...(hydration === undefined ? [] : [`Current hydration score is ${hydration}`]),
    ],
    recommendations: ["Consider a hydrating serum", "Pack a barrier-support moisturizer", "Use a gentle, non-stripping cleanser"],
  };
};
