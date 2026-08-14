export type AnalyticsEventType =
  | "trip_created"
  | "skin_scan_started"
  | "skin_scan_completed"
  | "skin_forecast_generated"
  | "product_recommendation_viewed"
  | "product_clicked"
  | "purchase_link_clicked"
  | "partner_product_clicked"
  | "partner_purchase_link_clicked";

export interface AnalyticsEvent {
  id: string;
  eventType: AnalyticsEventType;
  tripId?: string;
  productId?: string;
  retailer?: string;
  partner: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
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
