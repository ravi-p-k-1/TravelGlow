import type { CreateTripInput, Trip } from "../types/trip";

interface TripResponse {
  trip: Trip;
}

interface ErrorResponse {
  error?: string;
  details?: Record<string, string[]>;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function readResponse(response: Response): Promise<TripResponse> {
  const body = (await response.json()) as TripResponse | ErrorResponse;

  if (!response.ok) {
    const error = body as ErrorResponse;
    throw new ApiRequestError(
      error.error ?? "Something went wrong. Please try again.",
      error.details,
    );
  }

  return body as TripResponse;
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const response = await fetch("/api/trips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return (await readResponse(response)).trip;
}

export async function getTrip(id: string, signal?: AbortSignal): Promise<Trip> {
  const response = await fetch(`/api/trips/${encodeURIComponent(id)}`, { signal });
  return (await readResponse(response)).trip;
}
