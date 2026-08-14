import { skinEngineThresholds as threshold } from "../thresholds.js";
import type { SkinRule } from "../types.js";

export const coldRule: SkinRule = ({ skinAnalysis, destinationEnvironment, comparison }) => {
  const change = comparison.temperatureChangeF;
  const humidity = destinationEnvironment.humidity;
  if (change === undefined || humidity === undefined || change > -threshold.substantialTemperatureChangeF || humidity > threshold.lowHumidity) return null;
  const lowHydration = skinAnalysis.hydration !== undefined && skinAnalysis.hydration <= threshold.lowHydration;

  return {
    id: "barrier-dryness",
    concern: "Skin barrier and dryness",
    level: lowHydration ? "high" : "moderate",
    factors: [`Destination is ${Math.abs(change)}°F colder than home`, `Destination humidity is low at ${humidity}%`, ...(lowHydration ? ["Current hydration score is low"] : [])],
    recommendations: ["Pack a richer barrier-support moisturizer", "Use a gentle cleanser", "Consider reducing potentially drying products while traveling"],
  };
};
