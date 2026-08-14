import { z } from "zod";

export const analyticsEventTypeSchema = z.enum([
  "trip_created",
  "skin_scan_started",
  "skin_scan_completed",
  "skin_forecast_generated",
  "product_recommendation_viewed",
  "product_clicked",
  "purchase_link_clicked",
  "partner_product_clicked",
  "partner_purchase_link_clicked",
]);

export const analyticsEventInputSchema = z.object({
  eventType: analyticsEventTypeSchema,
  tripId: z.uuid().optional(),
  productId: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/).optional(),
  retailer: z.string().trim().min(1).max(120).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict().superRefine((value, context) => {
  if (!value.tripId) context.addIssue({ code: "custom", path: ["tripId"], message: "Trip id is required" });
  if (["product_recommendation_viewed", "product_clicked", "partner_product_clicked"].includes(value.eventType)) {
    if (!value.productId) context.addIssue({ code: "custom", path: ["productId"], message: "Product id is required for product events" });
  }
  if (["purchase_link_clicked", "partner_purchase_link_clicked"].includes(value.eventType)) {
    if (!value.productId) context.addIssue({ code: "custom", path: ["productId"], message: "Product id is required for purchase-link events" });
    if (!value.retailer) context.addIssue({ code: "custom", path: ["retailer"], message: "Retailer is required for purchase-link events" });
  }
  if (!["purchase_link_clicked", "partner_purchase_link_clicked"].includes(value.eventType) && value.retailer) {
    context.addIssue({ code: "custom", path: ["retailer"], message: "Retailer is only allowed for purchase-link events" });
  }
  if (["trip_created", "skin_scan_started", "skin_scan_completed", "skin_forecast_generated"].includes(value.eventType) && value.productId) {
    context.addIssue({ code: "custom", path: ["productId"], message: "Product id is not allowed for this event" });
  }
});

export type AnalyticsEventInput = z.infer<typeof analyticsEventInputSchema>;
