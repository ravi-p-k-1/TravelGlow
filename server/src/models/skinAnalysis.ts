export interface SkinAnalysis {
  id: string;
  tripId: string;
  oiliness?: number;
  hydration?: number;
  acne?: number;
  redness?: number;
  pores?: number;
  spots?: number;
  texture?: number;
  darkCircles?: number;
  wrinkles?: number;
  firmness?: number;
  radiance?: number;
  overallScore?: number;
  skinAge?: number;
  provider: string;
  externalTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export type NewSkinAnalysis = Omit<
  SkinAnalysis,
  "id" | "tripId" | "createdAt" | "updatedAt"
>;

export interface SelfieUpload {
  buffer: Buffer;
  contentType: "image/jpeg" | "image/png";
  fileName: string;
  size: number;
}
