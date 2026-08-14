import type { AnalyticsEvent, AnalyticsSummary } from "../models/analytics.js";
import {
  findPurchaseLinkContext,
  findRecommendedProductContext,
  getAnalyticsSummary as queryAnalyticsSummary,
  saveAnalyticsEvent,
} from "../repositories/analyticsRepository.js";
import type { AnalyticsEventInput } from "../domain/analytics/analyticsEventSchema.js";
import { ApiError } from "../utils/apiError.js";
import { getTrip } from "./tripService.js";

const productEvents = new Set(["product_recommendation_viewed", "product_clicked", "partner_product_clicked"]);
const purchaseEvents = new Set(["purchase_link_clicked", "partner_purchase_link_clicked"]);

export async function recordAnalyticsEvent(input: AnalyticsEventInput): Promise<AnalyticsEvent> {
  if (input.tripId) await getTrip(input.tripId);
  let partner = false;

  if (productEvents.has(input.eventType)) {
    const context = await findRecommendedProductContext(input.tripId!, input.productId!);
    if (!context) throw new ApiError(409, "Product is not recommended for this trip");
    partner = context.partner;
  } else if (purchaseEvents.has(input.eventType)) {
    const context = await findPurchaseLinkContext(input.tripId!, input.productId!, input.retailer!);
    if (!context) throw new ApiError(409, "Purchase link is not available for this trip recommendation");
    partner = context.partner;
  }

  if (input.eventType.startsWith("partner_") && !partner) {
    throw new ApiError(409, "This catalog item is not a partner placement");
  }
  return saveAnalyticsEvent({ ...input, partner });
}

export function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  return queryAnalyticsSummary();
}
