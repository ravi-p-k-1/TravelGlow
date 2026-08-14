import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { database } from "../config/database.js";
import type { Product, ProductCategory, ProductPurchaseLink, ProductRecommendation } from "../models/product.js";

interface ProductRow {
  id: string; name: string; brand: string; category: ProductCategory;
  price_cents: number | null; image_url: string | null; concerns: Product["concerns"];
  skin_types: string[]; climate_tags: string[]; spf: number | null;
  partner: boolean; partner_priority: number;
}
interface LinkRow { id: string; product_id: string; retailer: string; url: string; partner: boolean; }
interface RecommendationRow {
  id: string; trip_id: string; forecast_id: string; product_id: string;
  score: number; rank: number; reasons: string[]; created_at: Date;
}

const productColumns = "id, name, brand, category, price_cents, image_url, concerns, skin_types, climate_tags, spf, partner, partner_priority";

function mapProduct(row: ProductRow, links: ProductPurchaseLink[]): Product {
  return {
    id: row.id, name: row.name, brand: row.brand, category: row.category,
    priceCents: row.price_cents ?? undefined, imageUrl: row.image_url ?? undefined,
    concerns: row.concerns, skinTypes: row.skin_types, climateTags: row.climate_tags,
    spf: row.spf ?? undefined, partner: row.partner, partnerPriority: row.partner_priority,
    purchaseLinks: links,
  };
}

async function linksForProducts(productIds: string[]): Promise<Map<string, ProductPurchaseLink[]>> {
  if (productIds.length === 0) return new Map();
  const result = await database.query<LinkRow>(
    "SELECT id, product_id, retailer, url, partner FROM product_purchase_links WHERE product_id=ANY($1::text[]) ORDER BY retailer",
    [productIds],
  );
  const links = new Map<string, ProductPurchaseLink[]>();
  for (const row of result.rows) {
    const list = links.get(row.product_id) ?? [];
    list.push({ id: row.id, retailer: row.retailer, url: row.url, partner: row.partner });
    links.set(row.product_id, list);
  }
  return links;
}

export async function findAllProducts(): Promise<Product[]> {
  const result = await database.query<ProductRow>(`SELECT ${productColumns} FROM products ORDER BY brand, name`);
  const links = await linksForProducts(result.rows.map((row) => row.id));
  return result.rows.map((row) => mapProduct(row, links.get(row.id) ?? []));
}

export async function findProduct(productId: string): Promise<Product | null> {
  const result = await database.query<ProductRow>(`SELECT ${productColumns} FROM products WHERE id=$1`, [productId]);
  if (!result.rows[0]) return null;
  const links = await linksForProducts([productId]);
  return mapProduct(result.rows[0], links.get(productId) ?? []);
}

export async function findProductRecommendations(tripId: string): Promise<ProductRecommendation[]> {
  const result = await database.query<RecommendationRow>(
    "SELECT id, trip_id, forecast_id, product_id, score, rank, reasons, created_at FROM product_recommendations WHERE trip_id=$1 ORDER BY rank",
    [tripId],
  );
  if (result.rows.length === 0) return [];
  const products = await findAllProducts();
  const productMap = new Map(products.map((product) => [product.id, product]));
  return result.rows.flatMap((row) => {
    const product = productMap.get(row.product_id);
    return product ? [{ id: row.id, tripId: row.trip_id, forecastId: row.forecast_id,
      product, score: row.score, rank: row.rank, reasons: row.reasons,
      createdAt: row.created_at.toISOString() }] : [];
  });
}

async function insertRecommendation(client: PoolClient, tripId: string, forecastId: string, productId: string, score: number, rank: number, reasons: string[]) {
  await client.query(
    "INSERT INTO product_recommendations (id, trip_id, forecast_id, product_id, score, rank, reasons) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)",
    [randomUUID(), tripId, forecastId, productId, score, rank, JSON.stringify(reasons)],
  );
}

export async function saveProductRecommendations(
  tripId: string,
  forecastId: string,
  recommendations: Array<{ product: Product; score: number; reasons: string[] }>,
): Promise<ProductRecommendation[]> {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM product_recommendations WHERE trip_id=$1", [tripId]);
    for (const [index, recommendation] of recommendations.entries()) {
      await insertRecommendation(client, tripId, forecastId, recommendation.product.id, recommendation.score, index + 1, recommendation.reasons);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
  return findProductRecommendations(tripId);
}
