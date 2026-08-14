import type { SkinForecast } from "../types/skinForecast";

interface ForecastResponse { forecast: SkinForecast; }
interface ErrorResponse { error?: string; }

export class SkinForecastApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "SkinForecastApiError";
  }
}

async function requestForecast(tripId: string, method: "GET" | "POST", signal?: AbortSignal) {
  const response = await fetch(`/api/trips/${encodeURIComponent(tripId)}/forecast`, { method, signal });
  const body = (await response.json()) as ForecastResponse | ErrorResponse;
  if (!response.ok) throw new SkinForecastApiError(
    (body as ErrorResponse).error ?? "The travel skin forecast could not be generated.",
    response.status,
  );
  return (body as ForecastResponse).forecast;
}

export function getSkinForecast(tripId: string, signal?: AbortSignal) {
  return requestForecast(tripId, "GET", signal);
}

export function generateSkinForecast(tripId: string) {
  return requestForecast(tripId, "POST");
}
