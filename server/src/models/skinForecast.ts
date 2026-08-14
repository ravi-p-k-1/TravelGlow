import type { SkinConcernForecast } from "../domain/skin-engine/types.js";

export interface SkinForecast {
  id: string;
  tripId: string;
  skinAnalysisId: string;
  environmentComparisonId: string;
  concerns: SkinConcernForecast[];
  engineVersion: string;
  createdAt: string;
  updatedAt: string;
}
