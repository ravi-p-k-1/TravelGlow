import { compareEnvironments } from "../domain/environmentComparison.js";
import type { TripEnvironment } from "../models/environment.js";
import { findTripEnvironment, saveTripEnvironment } from "../repositories/environmentRepository.js";
import { getTrip } from "./tripService.js";
import { getEnvironment } from "./weatherService.js";
import { ApiError } from "../utils/apiError.js";

export async function getPersistedEnvironment(tripId: string): Promise<TripEnvironment> {
  await getTrip(tripId);
  const environment = await findTripEnvironment(tripId);
  if (!environment) throw new ApiError(404, "Environment data has not been generated for this trip");
  return environment;
}

export async function generateEnvironment(tripId: string): Promise<TripEnvironment> {
  const trip = await getTrip(tripId);
  const existing = await findTripEnvironment(tripId);
  if (existing) return existing;

  const [currentData, destinationData] = await Promise.all([
    getEnvironment(trip.currentLocation, "current"),
    getEnvironment(trip.destination, "destination"),
  ]);
  const current = { ...currentData, id: "", tripId, snapshotType: "current" as const, createdAt: "" };
  const destination = { ...destinationData, id: "", tripId, snapshotType: "destination" as const, createdAt: "" };
  return saveTripEnvironment(tripId, currentData, destinationData, compareEnvironments(current, destination));
}
