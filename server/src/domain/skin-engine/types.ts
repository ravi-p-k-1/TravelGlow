import type { EnvironmentData, EnvironmentComparison } from "../../models/environment.js";
import type { SkinAnalysis } from "../../models/skinAnalysis.js";

export type ConcernLevel = "low" | "moderate" | "high";
export type ConcernId =
  | "uv-protection"
  | "oiliness"
  | "hydration"
  | "heat-congestion"
  | "barrier-dryness";

export interface SkinConcernForecast {
  id: ConcernId;
  concern: string;
  level: ConcernLevel;
  factors: string[];
  recommendations: string[];
}

export interface TravelSkinInput {
  skinAnalysis: SkinAnalysis;
  currentEnvironment: EnvironmentData;
  destinationEnvironment: EnvironmentData;
  comparison: EnvironmentComparison;
}

export type SkinRule = (input: TravelSkinInput) => SkinConcernForecast | null;
