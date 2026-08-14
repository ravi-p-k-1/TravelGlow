import { runTravelSkinEngine, SKIN_ENGINE_VERSION } from "../domain/skin-engine/travelSkinEngine.js";
import type { SkinForecast } from "../models/skinForecast.js";
import { findTripEnvironment } from "../repositories/environmentRepository.js";
import { findSkinAnalysis } from "../repositories/skinAnalysisRepository.js";
import { findSkinForecast, saveSkinForecast } from "../repositories/skinForecastRepository.js";
import { ApiError } from "../utils/apiError.js";
import { getTrip } from "./tripService.js";

export async function getPersistedForecast(tripId: string): Promise<SkinForecast> {
  await getTrip(tripId);
  const forecast = await findSkinForecast(tripId);
  if (!forecast) throw new ApiError(404, "Travel skin forecast has not been generated for this trip");
  return forecast;
}

export async function generateForecast(tripId: string): Promise<SkinForecast> {
  await getTrip(tripId);
  const existing = await findSkinForecast(tripId);
  if (existing) return existing;
  const [skinAnalysis, environment] = await Promise.all([
    findSkinAnalysis(tripId), findTripEnvironment(tripId),
  ]);
  if (!skinAnalysis) throw new ApiError(409, "Complete a skin analysis before generating the forecast");
  if (!environment) throw new ApiError(409, "Generate destination conditions before generating the forecast");
  const concerns = runTravelSkinEngine({ skinAnalysis,
    currentEnvironment: environment.current,
    destinationEnvironment: environment.destination,
    comparison: environment.comparison });
  return saveSkinForecast(tripId, skinAnalysis.id, environment.comparison.id,
    concerns, SKIN_ENGINE_VERSION);
}
