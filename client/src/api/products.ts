import type { Product, ProductRecommendation } from "../types/product";

interface RecommendationsResponse { recommendations: ProductRecommendation[]; }
interface ProductResponse { product: Product; }
interface ErrorResponse { error?: string; }

export class ProductApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ProductApiError";
  }
}

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  const body = (await response.json()) as T | ErrorResponse;
  if (!response.ok) throw new ProductApiError((body as ErrorResponse).error ?? fallback, response.status);
  return body as T;
}

export async function getTripProducts(tripId: string, signal?: AbortSignal) {
  const response = await fetch(`/api/trips/${encodeURIComponent(tripId)}/products`, { signal });
  return (await parseResponse<RecommendationsResponse>(response, "Product recommendations could not be retrieved.")).recommendations;
}

export async function getProduct(productId: string, signal?: AbortSignal) {
  const response = await fetch(`/api/products/${encodeURIComponent(productId)}`, { signal });
  return (await parseResponse<ProductResponse>(response, "Product could not be retrieved.")).product;
}
