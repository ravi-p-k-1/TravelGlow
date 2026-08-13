import type { TripEnvironment } from "../types/environment";

interface EnvironmentResponse {
  environment: TripEnvironment;
}

interface ErrorResponse {
  error?: string;
}

export class EnvironmentApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "EnvironmentApiError";
  }
}

async function requestEnvironment(
  tripId: string,
  method: "GET" | "POST",
  signal?: AbortSignal,
): Promise<TripEnvironment> {
  const response = await fetch(
    `/api/trips/${encodeURIComponent(tripId)}/environment`,
    { method, signal },
  );
  const body = (await response.json()) as EnvironmentResponse | ErrorResponse;
  if (!response.ok) {
    throw new EnvironmentApiError(
      (body as ErrorResponse).error ?? "Destination conditions could not be retrieved.",
      response.status,
    );
  }
  return (body as EnvironmentResponse).environment;
}

export function getTripEnvironment(tripId: string, signal?: AbortSignal) {
  return requestEnvironment(tripId, "GET", signal);
}

export function generateTripEnvironment(tripId: string) {
  return requestEnvironment(tripId, "POST");
}
