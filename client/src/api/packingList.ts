import type { PackingList } from "../types/packingList";

interface PackingListResponse { packingList: PackingList; }
interface ErrorResponse { error?: string; }

export class PackingListApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "PackingListApiError";
  }
}

async function requestPackingList(tripId: string, method: "GET" | "POST", signal?: AbortSignal) {
  const response = await fetch(`/api/trips/${encodeURIComponent(tripId)}/packing-list`, { method, signal });
  const body = (await response.json()) as PackingListResponse | ErrorResponse;
  if (!response.ok) {
    throw new PackingListApiError(
      (body as ErrorResponse).error ?? "The packing list could not be generated.",
      response.status,
    );
  }
  return (body as PackingListResponse).packingList;
}

export function generatePackingList(tripId: string, signal?: AbortSignal) {
  return requestPackingList(tripId, "POST", signal);
}

export function getPackingList(tripId: string, signal?: AbortSignal) {
  return requestPackingList(tripId, "GET", signal);
}
