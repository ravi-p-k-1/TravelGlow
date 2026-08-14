export type ProductCategory = "sunscreen" | "cleanser" | "moisturizer" | "hydrating-serum" | "lip-spf" | "facial-mist" | "after-sun";

export interface ProductPurchaseLink {
  id: string;
  retailer: string;
  url: string;
  partner: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  priceCents?: number;
  imageUrl?: string;
  concerns: string[];
  skinTypes: string[];
  climateTags: string[];
  spf?: number;
  partner: boolean;
  partnerPriority: number;
  purchaseLinks: ProductPurchaseLink[];
}

export interface ProductRecommendation {
  id: string;
  tripId: string;
  forecastId: string;
  product: Product;
  score: number;
  rank: number;
  reasons: string[];
  createdAt: string;
}
