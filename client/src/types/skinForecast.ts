export type ConcernLevel = "low" | "moderate" | "high";

export interface SkinConcernForecast {
  id: string;
  concern: string;
  level: ConcernLevel;
  factors: string[];
  recommendations: string[];
}

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
