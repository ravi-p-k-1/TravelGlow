import { skinEngineThresholds as threshold } from "../thresholds.js";
import type { SkinRule } from "../types.js";

export const heatRule: SkinRule = ({ skinAnalysis, comparison }) => {
  const increase = comparison.temperatureChangeF;
  if (increase === undefined || increase < threshold.substantialTemperatureChangeF) return null;
  const elevatedOiliness = (skinAnalysis.oiliness ?? 0) >= threshold.elevatedOiliness;
  const elevatedAcne = (skinAnalysis.acne ?? 0) >= threshold.elevatedAcne;
  if (!elevatedOiliness && !elevatedAcne) return null;

  return {
    id: "heat-congestion",
    concern: "Heat and congestion",
    level: elevatedOiliness && elevatedAcne ? "high" : "moderate",
    factors: [
      `Destination is ${increase}°F warmer than home`,
      ...(elevatedOiliness ? ["Current oiliness score is elevated"] : []),
      ...(elevatedAcne ? ["Current acne-related score is elevated"] : []),
    ],
    recommendations: ["Use lightweight skincare layers", "Cleanse gently after sweating", "Avoid introducing heavy products during the trip"],
  };
};
