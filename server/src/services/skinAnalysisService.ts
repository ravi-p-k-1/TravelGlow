import type { SelfieUpload, SkinAnalysis } from "../models/skinAnalysis.js";
import { findSkinAnalysis, saveSkinAnalysis } from "../repositories/skinAnalysisRepository.js";
import { ApiError } from "../utils/apiError.js";
import { getTrip } from "./tripService.js";
import { analyzeSelfie } from "./youcamService.js";
import { getImageDimensions } from "../utils/imageDimensions.js";

export async function getPersistedSkinAnalysis(tripId: string): Promise<SkinAnalysis> {
  await getTrip(tripId);
  const analysis = await findSkinAnalysis(tripId);
  if (!analysis) throw new ApiError(404, "Skin analysis has not been completed for this trip");
  return analysis;
}

export async function createSkinAnalysis(
  tripId: string,
  image: SelfieUpload,
): Promise<SkinAnalysis> {
  await getTrip(tripId);
  const dimensions = getImageDimensions(image.buffer, image.contentType);
  if (Math.min(dimensions.width, dimensions.height) < 480) {
    throw new ApiError(400, "Selfie resolution is too small. The shortest side must be at least 480 pixels.");
  }
  return saveSkinAnalysis(tripId, await analyzeSelfie(image));
}
