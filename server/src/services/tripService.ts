import type { CreateTripInput, Trip, UpdateTripInput } from "../models/trip.js";
import {
  createTrip as insertTrip,
  findTripById,
  updateTrip as persistTripUpdate,
} from "../repositories/tripRepository.js";
import { ApiError } from "../utils/apiError.js";

function normalizeLocation(location: string): string {
  return location.trim().replace(/\s+/g, " ");
}

function assertDateOrder(departureDate: string, returnDate: string): void {
  if (returnDate < departureDate) {
    throw new ApiError(400, "Return date must be on or after departure date", {
      returnDate: ["Return date must be on or after departure date"],
    });
  }
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  assertDateOrder(input.departureDate, input.returnDate);

  return insertTrip({
    ...input,
    currentLocation: normalizeLocation(input.currentLocation),
    destination: normalizeLocation(input.destination),
  });
}

export async function getTrip(id: string): Promise<Trip> {
  const trip = await findTripById(id);
  if (!trip) throw new ApiError(404, "Trip not found");
  return trip;
}

export async function updateTrip(id: string, input: UpdateTripInput): Promise<Trip> {
  const existingTrip = await getTrip(id);
  const normalizedInput: UpdateTripInput = {
    ...input,
    ...(input.currentLocation
      ? { currentLocation: normalizeLocation(input.currentLocation) }
      : {}),
    ...(input.destination
      ? { destination: normalizeLocation(input.destination) }
      : {}),
  };

  assertDateOrder(
    normalizedInput.departureDate ?? existingTrip.departureDate,
    normalizedInput.returnDate ?? existingTrip.returnDate,
  );

  const trip = await persistTripUpdate(id, normalizedInput);
  if (!trip) throw new ApiError(404, "Trip not found");
  return trip;
}
