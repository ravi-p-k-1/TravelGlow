export type AnalyticsEventType =
  | "product_recommendation_viewed"
  | "product_clicked"
  | "purchase_link_clicked"
  | "partner_product_clicked"
  | "partner_purchase_link_clicked";

export interface AnalyticsEventInput {
  eventType: AnalyticsEventType;
  tripId: string;
  productId: string;
  retailer?: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsSummary {
  generatedAt: string;
  totals: {
    trips: number;
    skinScans: number;
    forecasts: number;
    productImpressions: number;
    productClicks: number;
    purchaseLinkClicks: number;
    partnerImpressions: number;
    partnerClicks: number;
    productCtr: number;
  };
  topProducts: Array<{ productId: string; name: string; brand: string; clicks: number }>;
  topRetailers: Array<{ retailer: string; clicks: number }>;
  topCategories: Array<{ category: string; recommendations: number }>;
}
