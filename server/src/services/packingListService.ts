import {
  generatePackingItems,
  PACKING_LIST_GENERATOR_VERSION,
} from "../domain/packing-list/packingListGenerator.js";
import type { PackingList } from "../models/packingList.js";
import { findTripEnvironment } from "../repositories/environmentRepository.js";
import { findPackingList, savePackingList } from "../repositories/packingListRepository.js";
import { findSkinAnalysis } from "../repositories/skinAnalysisRepository.js";
import { ApiError } from "../utils/apiError.js";
import { generateForecast, getPersistedForecast } from "./skinForecastService.js";
import { getTrip } from "./tripService.js";

export async function getPersistedPackingList(tripId: string): Promise<PackingList> {
  await getTrip(tripId);
  const packingList = await findPackingList(tripId);
  if (!packingList) throw new ApiError(404, "Packing list has not been generated for this trip");
  return packingList;
}

export async function generatePackingList(tripId: string): Promise<PackingList> {
  await getTrip(tripId);
  const existing = await findPackingList(tripId);
  if (existing) {
    const forecast = await getPersistedForecast(tripId);
    if (existing.forecastId === forecast.id) return existing;
  }

  const forecast = await generateForecast(tripId);
  const [skinAnalysis, environment] = await Promise.all([
    findSkinAnalysis(tripId),
    findTripEnvironment(tripId),
  ]);
  if (!skinAnalysis || !environment) {
    throw new ApiError(409, "Complete the forecast before generating a packing list");
  }

  const items = generatePackingItems({
    concerns: forecast.concerns,
    destinationEnvironment: environment.destination,
    skinAnalysis,
  });
  return savePackingList(tripId, forecast.id, items, PACKING_LIST_GENERATOR_VERSION);
}
