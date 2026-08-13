import type { SkinAnalysis } from "../types/skinAnalysis";

interface AnalysisResponse { analysis: SkinAnalysis; }
interface ErrorResponse { error?: string; }

export class SkinAnalysisApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "SkinAnalysisApiError";
  }
}

async function readAnalysis(response: Response): Promise<SkinAnalysis> {
  const body = (await response.json()) as AnalysisResponse | ErrorResponse;
  if (!response.ok) {
    throw new SkinAnalysisApiError(
      (body as ErrorResponse).error ?? "Skin analysis is temporarily unavailable.",
      response.status,
    );
  }
  return (body as AnalysisResponse).analysis;
}

export async function getSkinAnalysis(tripId: string, signal?: AbortSignal) {
  return readAnalysis(await fetch(
    `/api/trips/${encodeURIComponent(tripId)}/skin-analysis`, { signal },
  ));
}

export async function analyzeSelfie(tripId: string, image: File) {
  const form = new FormData();
  form.append("image", image);
  return readAnalysis(await fetch(
    `/api/trips/${encodeURIComponent(tripId)}/skin-analysis`,
    { method: "POST", body: form },
  ));
}
