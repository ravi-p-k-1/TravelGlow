import { skinEngineThresholds as threshold } from "../thresholds.js";
import type { ConcernLevel, SkinRule } from "../types.js";

export const uvRule: SkinRule = ({ destinationEnvironment }) => {
  const uv = destinationEnvironment.uvIndex;
  if (uv === undefined) return null;
  const level: ConcernLevel = uv >= threshold.highUv
    ? "high"
    : uv >= threshold.moderateUv ? "moderate" : "low";

  return {
    id: "uv-protection",
    concern: "UV protection",
    level,
    factors: [`Destination UV index is ${uv}`],
    recommendations: level === "low"
      ? ["Continue daily broad-spectrum sunscreen"]
      : ["Use broad-spectrum SPF 50 sunscreen", "Reapply sunscreen throughout the day", "Consider shade and protective clothing"],
  };
};
