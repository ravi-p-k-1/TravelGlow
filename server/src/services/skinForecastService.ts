import { runTravelSkinEngine, SKIN_ENGINE_VERSION } from "../domain/skin-engine/travelSkinEngine.js";
import type { SkinForecast } from "../models/skinForecast.js";
import { findTripEnvironment } from "../repositories/environmentRepository.js";
import { findSkinAnalysis } from "../repositories/skinAnalysisRepository.js";
import { findSkinForecast, saveForecastExplanation, saveSkinForecast } from "../repositories/skinForecastRepository.js";
import { ApiError } from "../utils/apiError.js";
import { getTrip } from "./tripService.js";
import { generateForecastExplanation } from "./geminiService.js";
import { env } from "../config/env.js";

export async function getPersistedForecast(tripId: string): Promise<SkinForecast> {
  await getTrip(tripId);
  const forecast = await findSkinForecast(tripId);
  if (!forecast) throw new ApiError(404, "Travel skin forecast has not been generated for this trip");
  return forecast;
}

export async function generateForecast(tripId: string): Promise<SkinForecast> {
  await getTrip(tripId);
  const [skinAnalysis, environment] = await Promise.all([
    findSkinAnalysis(tripId), findTripEnvironment(tripId),
  ]);
  if (!skinAnalysis) throw new ApiError(409, "Complete a skin analysis before generating the forecast");
  if (!environment) throw new ApiError(409, "Generate destination conditions before generating the forecast");
  let forecast = await findSkinForecast(tripId);
  if (!forecast) {
    const concerns = runTravelSkinEngine({ skinAnalysis,
      currentEnvironment: environment.current,
      destinationEnvironment: environment.destination,
      comparison: environment.comparison });
    forecast = await saveSkinForecast(tripId, skinAnalysis.id,
      environment.comparison.id, concerns, SKIN_ENGINE_VERSION);
  }

  if (!forecast.explanation) {
    try {
      const explanation = await generateForecastExplanation({ skinAnalysis,
        destinationEnvironment: environment.destination,
        comparison: environment.comparison, concerns: forecast.concerns });
      forecast = await saveForecastExplanation(tripId, explanation, env.geminiModel);
    } catch (error) {
      console.error("Gemini explanation unavailable; returning deterministic forecast", error);
    }
  }
  return forecast;
}
