import { skinEngineThresholds as threshold } from "../thresholds.js";
import type { SkinRule } from "../types.js";

export const humidityRule: SkinRule = ({ skinAnalysis, destinationEnvironment }) => {
  const humidity = destinationEnvironment.humidity;
  const oiliness = skinAnalysis.oiliness;
  if (humidity === undefined || oiliness === undefined || humidity < threshold.highHumidity || oiliness < threshold.moderateOiliness) return null;

  const level = oiliness >= threshold.elevatedOiliness ? "high" : "moderate";
  return {
    id: "oiliness",
    concern: "Oiliness",
    level,
    factors: [`Destination humidity is high at ${humidity}%`, `Current oiliness score is ${oiliness}`],
    recommendations: ["Use a lightweight moisturizer", "Prefer non-comedogenic skincare", "Cleanse gently after heavy sweating"],
  };
};
