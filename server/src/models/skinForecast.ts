import type { SkinConcernForecast } from "../domain/skin-engine/types.js";

export interface ForecastExplanationConcern {
  concernId: string;
  explanation: string;
}

export interface ForecastExplanation {
  headline: string;
  summary: string;
  concerns: ForecastExplanationConcern[];
  travelTips: string[];
}

export interface SkinForecast {
  id: string;
  tripId: string;
  skinAnalysisId: string;
  environmentComparisonId: string;
  concerns: SkinConcernForecast[];
  engineVersion: string;
  explanation?: ForecastExplanation;
  explanationModel?: string;
  explainedAt?: string;
  createdAt: string;
  updatedAt: string;
}
