import { randomUUID } from "node:crypto";
import { database } from "../config/database.js";
import type { AnalyticsEvent, AnalyticsEventType, AnalyticsSummary } from "../models/analytics.js";

interface EventRow {
  id: string; event_type: AnalyticsEventType; trip_id: string | null;
  product_id: string | null; retailer: string | null; partner: boolean;
  metadata: Record<string, unknown>; created_at: Date;
}
interface TotalsRow {
  trips: number; skin_scans: number; forecasts: number; product_impressions: number;
  product_clicks: number; purchase_link_clicks: number; partner_impressions: number; partner_clicks: number;
}
interface TopProductRow { product_id: string; name: string; brand: string; clicks: number; }
interface TopRetailerRow { retailer: string; clicks: number; }
interface TopCategoryRow { category: string; recommendations: number; }

function mapEvent(row: EventRow): AnalyticsEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    tripId: row.trip_id ?? undefined,
    productId: row.product_id ?? undefined,
    retailer: row.retailer ?? undefined,
    partner: row.partner,
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
  };
}

export async function findRecommendedProductContext(tripId: string, productId: string): Promise<{ partner: boolean } | null> {
  const result = await database.query<{ partner: boolean }>(
    `SELECT p.partner FROM products p
     INNER JOIN product_recommendations pr ON pr.product_id=p.id
     WHERE pr.trip_id=$1 AND p.id=$2`,
    [tripId, productId],
  );
  return result.rows[0] ?? null;
}

export async function findPurchaseLinkContext(tripId: string, productId: string, retailer: string): Promise<{ partner: boolean } | null> {
  const result = await database.query<{ partner: boolean }>(
    `SELECT (p.partner OR ppl.partner) AS partner
     FROM product_purchase_links ppl
     INNER JOIN products p ON p.id=ppl.product_id
     INNER JOIN product_recommendations pr ON pr.product_id=p.id AND pr.trip_id=$1
     WHERE p.id=$2 AND LOWER(ppl.retailer)=LOWER($3)`,
    [tripId, productId, retailer],
  );
  return result.rows[0] ?? null;
}

export async function saveAnalyticsEvent(input: {
  eventType: AnalyticsEventType;
  tripId?: string;
  productId?: string;
  retailer?: string;
  partner: boolean;
  metadata?: Record<string, unknown>;
}): Promise<AnalyticsEvent> {
  const result = await database.query<EventRow>(
    `INSERT INTO analytics_events (id, event_type, trip_id, product_id, retailer, partner, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
     RETURNING id, event_type, trip_id, product_id, retailer, partner, metadata, created_at`,
    [randomUUID(), input.eventType, input.tripId ?? null, input.productId ?? null,
      input.retailer ?? null, input.partner, JSON.stringify(input.metadata ?? {})],
  );
  return mapEvent(result.rows[0]!);
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [totalsResult, productsResult, retailersResult, categoriesResult] = await Promise.all([
    database.query<TotalsRow>(`
      SELECT
        (SELECT COUNT(*)::int FROM trips) AS trips,
        (SELECT COUNT(*)::int FROM skin_analyses) AS skin_scans,
        (SELECT COUNT(*)::int FROM skin_forecasts) AS forecasts,
        COUNT(*) FILTER (WHERE event_type='product_recommendation_viewed')::int AS product_impressions,
        COUNT(*) FILTER (WHERE event_type IN ('product_clicked','partner_product_clicked'))::int AS product_clicks,
        COUNT(*) FILTER (WHERE event_type IN ('purchase_link_clicked','partner_purchase_link_clicked'))::int AS purchase_link_clicks,
        COUNT(*) FILTER (WHERE event_type='product_recommendation_viewed' AND partner)::int AS partner_impressions,
        COUNT(*) FILTER (WHERE event_type IN ('product_clicked','purchase_link_clicked','partner_product_clicked','partner_purchase_link_clicked') AND partner)::int AS partner_clicks
      FROM analytics_events
    `),
    database.query<TopProductRow>(`
      SELECT p.id AS product_id, p.name, p.brand, COUNT(*)::int AS clicks
      FROM analytics_events ae INNER JOIN products p ON p.id=ae.product_id
      WHERE ae.event_type IN ('product_clicked','partner_product_clicked')
      GROUP BY p.id, p.name, p.brand ORDER BY clicks DESC, p.name LIMIT 5
    `),
    database.query<TopRetailerRow>(`
      SELECT retailer, COUNT(*)::int AS clicks FROM analytics_events
      WHERE event_type IN ('purchase_link_clicked','partner_purchase_link_clicked') AND retailer IS NOT NULL
      GROUP BY retailer ORDER BY clicks DESC, retailer LIMIT 5
    `),
    database.query<TopCategoryRow>(`
      SELECT p.category, COUNT(*)::int AS recommendations
      FROM product_recommendations pr INNER JOIN products p ON p.id=pr.product_id
      GROUP BY p.category ORDER BY recommendations DESC, p.category LIMIT 5
    `),
  ]);
  const totals = totalsResult.rows[0]!;
  const productCtr = totals.product_impressions === 0
    ? 0
    : Number(((totals.product_clicks / totals.product_impressions) * 100).toFixed(1));
  return {
    generatedAt: new Date().toISOString(),
    totals: {
      trips: totals.trips,
      skinScans: totals.skin_scans,
      forecasts: totals.forecasts,
      productImpressions: totals.product_impressions,
      productClicks: totals.product_clicks,
      purchaseLinkClicks: totals.purchase_link_clicks,
      partnerImpressions: totals.partner_impressions,
      partnerClicks: totals.partner_clicks,
      productCtr,
    },
    topProducts: productsResult.rows.map((row) => ({ productId: row.product_id, name: row.name, brand: row.brand, clicks: row.clicks })),
    topRetailers: retailersResult.rows,
    topCategories: categoriesResult.rows,
  };
}
