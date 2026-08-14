import { rankProducts } from "../domain/product-ranking/productRanker.js";
import type { Product, ProductRecommendation } from "../models/product.js";
import { findTripEnvironment } from "../repositories/environmentRepository.js";
import {
  findAllProducts,
  findProduct,
  findProductRecommendations,
  saveProductRecommendations,
} from "../repositories/productRepository.js";
import { findSkinAnalysis } from "../repositories/skinAnalysisRepository.js";
import { ApiError } from "../utils/apiError.js";
import { generatePackingList } from "./packingListService.js";
import { getPersistedForecast } from "./skinForecastService.js";
import { getTrip } from "./tripService.js";

export async function getProduct(productId: string): Promise<Product> {
  const product = await findProduct(productId);
  if (!product) throw new ApiError(404, "Product not found");
  return product;
}

export async function getTripProductRecommendations(tripId: string): Promise<ProductRecommendation[]> {
  await getTrip(tripId);
  const existing = await findProductRecommendations(tripId);
  if (existing.length > 0) return existing;

  const packingList = await generatePackingList(tripId);
  const [forecast, products, environment, skinAnalysis] = await Promise.all([
    getPersistedForecast(tripId),
    findAllProducts(),
    findTripEnvironment(tripId),
    findSkinAnalysis(tripId),
  ]);
  if (!environment || !skinAnalysis) {
    throw new ApiError(409, "Complete the travel skin forecast before viewing products");
  }

  const ranked = rankProducts({
    products,
    packingItems: packingList.items,
    concerns: forecast.concerns,
    destinationEnvironment: environment.destination,
    skinAnalysis,
  });
  return saveProductRecommendations(tripId, forecast.id, ranked);
}
